'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';


export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fff',
          }}
        >
          <div className="loader-spin" />
          <style jsx>{`
            .loader-spin { width: 40px; height: 40px; border: 3px solid #f1f5f9; border-top-color: #7A1F2B; border-radius: 50%; animation: spin 0.8s linear infinite; }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get('courseId');
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }


    setLoading(true);
    apiGet(`/api/v1/courses/${courseId}`)
      .then(res => {
        if (res.data) {
          setCourse(res.data);
        } else {
          setError(res.error?.message || 'Course information unavailable.');
        }
      })
      .catch(err => {
        setError('Failed to connect to the server.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [courseId]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !document.getElementById('razorpay-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  async function handlePay() {
    if (!course) return;
    

    setProcessing(true);
    setError('');

    try {
      const orderRes = await apiPost('/api/v1/payments/razorpay/order', {
        courseId: course._id,
        // priceInr is already in paise - pass it directly
        amount: course.priceInr || course.price,
      });

      if (orderRes.error) {
        setError(orderRes.error.message);
        setProcessing(false);
        return;
      }

      const orderData = orderRes.data?.order || orderRes.data;
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || orderData.key_id || 'rzp_test_placeholder',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Founder Velocity',
        description: `Enrollment: ${course.title}`,
        order_id: orderData.id || orderData.orderId,
        handler: async function (response) {
          try {
            const verifyRes = await apiPost('/api/v1/payments/razorpay/verify', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            if (verifyRes.error) {
              setError('Payment verification failed. Please contact support.');
              setProcessing(false);
            } else {
              router.push(`/learn/${course._id}`);
            }
          } catch (err) {
            setError('An unexpected error occurred during verification.');
            setProcessing(false);
          }
        },
        modal: { ondismiss: () => setProcessing(false) },
        theme: { color: '#7A1F2B' },
      };

      if (window.Razorpay) {
        new window.Razorpay(options).open();
      } else {
        setError('Payment gateway is still loading or blocked. Please refresh.');
        setProcessing(false);
      }
    } catch (err) {
      console.error('Payment Error:', err);
      setError(err.message || 'Could not initiate payment. Check server connection.');
      setProcessing(false);
    }
  }

  async function handleManualEnroll() {
    if (!course) return;
    setProcessing(true);
    setError('');
    
    try {
      const res = await apiPost('/api/v1/enrollments', {
        courseId: course._id,
        paymentVerified: true,
        paymentStatus: 'manual_trial',
        amountPaid: 0
      });

      if (res.error) {
        setError(res.error.message);
        setProcessing(false);
      } else {
        router.push(`/learn/${course._id}`);
      }
    } catch (err) {
      setError('Manual enrollment failed.');
      setProcessing(false);
    }
  }

  if (loading) return <div className="checkout-loader"><div className="loader-spin" /></div>;

  if (!courseId || !course) {
    return (
      <div className="checkout-empty">
        <div className="empty-card">
          <h1>No Course Selected</h1>
          <p>Please browse our catalog to find a program that fits your goals.</p>
          <Link href="/dashboard/explore-courses" className="btn-primary">Browse Catalog</Link>
        </div>
        <style jsx>{`
          .checkout-empty { height: 100vh; display: flex; align-items: center; justify-content: center; background: #fafafa; }
          .empty-card { text-align: center; background: #fff; padding: 4rem; border-radius: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
          .btn-primary { display: inline-block; margin-top: 2rem; padding: 1rem 2.5rem; background: #7A1F2B; color: #fff; border-radius: 12px; font-weight: 700; text-decoration: none; }
        `}</style>
      </div>
    );
  }

  // priceInr is stored in paise - divide by 100 for display
  const price = Math.round((course.priceInr || course.price || 0) / 100);
  const displayPrice = course.priceInr || course.price || 0; // keep paise for Razorpay amount field

  // Generate dynamic syllabus based on category
  const getSyllabus = (category) => {
    const base = [
      { title: 'Foundation & Mindset', details: 'Identifying high-impact problems and building the resilience required for the journey.' },
      { title: 'Market Analysis', details: 'Deep dive into customer discovery, competitor mapping, and blue ocean strategies.' },
      { title: 'Execution & Scale', details: 'From MVP development to hiring your first team and scaling operations.' },
      { title: 'Fundraising & Exit', details: 'Pitching to VCs, understanding term sheets, and building for long-term value.' }
    ];
    
    if (category === 'Technology') return [
      { title: 'The Tech Stack', details: 'Choosing between no-code, low-code, and custom AI architectures.' },
      { title: 'Building with GenAI', details: 'Integrating LLMs into your product and handling data privacy.' },
      { title: 'Scaling Infrastructure', details: 'Cloud architectures that grow with your user base.' },
      { title: 'Future-Proofing', details: 'Staying ahead of the rapidly evolving deep-tech landscape.' }
    ];

    if (category === 'Finance') return [
      { title: 'Financial Modeling', details: 'Building robust projections that stand up to VC scrutiny.' },
      { title: 'The Pitch Deck', details: 'Slide-by-slide masterclass on telling a compelling financial story.' },
      { title: 'Term Sheets', details: 'Navigating valuation, liquidation preferences, and board seats.' },
      { title: 'Post-Funding', details: 'Managing cash burn and reporting to investors.' }
    ];

    return base;
  };

  const syllabus = getSyllabus(course.category);

  return (
    <>
      <div className="checkout-container">
        {/* Premium Dark Header */}
        <div className="checkout-hero">
          <div className="hero-inner">
          <Link href="/dashboard/explore-courses" className="hero-back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}><path d="M15 18l-6-6 6-6"/></svg>
            <span>Back to Explore</span>
          </Link>
          <div className="hero-content">
            <span className="hero-badge">Official Enrollment Portal</span>
              <h1 className="hero-title">Secure Your Spot in {course.title}</h1>
              <p className="hero-subtitle">Join the elite tribe of founders building the next generation of Indian startups.</p>
            </div>
          </div>
        </div>

        <div className="checkout-inner">
          <div className="checkout-grid">
            {/* Left Column: Extensive Details */}
            <div className="checkout-main">
              <div className="checkout-card main-info">
                <div className="program-preview-premium">
                  <div className="premium-thumb">
                    <img src={course.thumbnailUrl || course.thumbnail || '/assets/images/course-placeholder.png'} alt={course.title} />
                    <div className="thumb-overlay" />
                  </div>
                  <div className="premium-details">
                    <span className="premium-category">{course.category || 'Entrepreneurship'}</span>
                    <h3>{course.title}</h3>
                    <div className="premium-meta">
                      <span className="meta-item">{course.duration || '8 Weeks'}</span>
                      <span className="meta-sep">•</span>
                      <span className="meta-item">{course.enrolledCount || '120'}+ Enrolled</span>
                      <span className="meta-sep">•</span>
                      <span className="meta-item">Certified</span>
                    </div>
                  </div>
                </div>

                <div className="program-description">
                  <p>{course.description || 'This intensive program is designed to take you from a curious observer to a confident startup founder. Learn the exact frameworks used by India\'s top unicorns.'}</p>
                </div>

                <div className="value-props">
                  <div className="prop-card">
                    <div className="prop-icon">🚀</div>
                    <h6>Weekly Live Sessions</h6>
                    <p>Interactive sessions with industry veterans and mentors.</p>
                  </div>
                  <div className="prop-card">
                    <div className="prop-icon">🤝</div>
                    <h6>Tribe Access</h6>
                    <p>Lifetime access to our private community of 10k+ founders.</p>
                  </div>
                  <div className="prop-card">
                    <div className="prop-icon">🛠️</div>
                    <h6>Founder Toolkit</h6>
                    <p>₹2 Lakh+ worth of partner credits and software tools.</p>
                  </div>
                </div>

                <div className="benefits-section">
                  <h4>What you&apos;ll get:</h4>
                  <div className="benefits-grid">
                    {[
                      'Full Curriculum Access',
                      'Verified Certificate',
                      'Mentor Office Hours',
                      'Private Tribe Community',
                      'Startup Toolkits',
                      'Networking Access'
                    ].map((text, i) => (
                      <div key={i} className="benefit-item">
                        <div className="benefit-icon">✓</div>
                        {text}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="syllabus-preview">
                  <div className="syllabus-header">
                    <h4>Program Curriculum</h4>
                  </div>
                  <div className="syllabus-list">
                    {syllabus.map((s, i) => (
                      <div key={i} className="syllabus-item-detailed">
                        <div className="syllabus-item-header">
                          <span className="index">0{i+1}</span>
                          <span className="text">{s.title}</span>
                        </div>
                        <p className="syllabus-item-desc">{s.details}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="founder-quote-card">
                  <div className="quote-icon">“</div>
                  <p className="quote-text">
                    The entrepreneurial journey is not about having all the answers, but about having the courage to ask the right questions. This program is designed to give you the framework to build something that actually matters.
                  </p>
                  <div className="founder-info">
                    <div className="founder-avatar-mini">
                      <img src="https://ui-avatars.com/api/?name=Founder&background=7A1F2B&color=fff" alt="Founder" />
                    </div>
                    <div>
                      <span className="founder-name">{course.instructor || 'The Founder Team'}</span>
                      <span className="founder-title">Lead Mentor, Startups India</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Sidebar */}
            <aside className="checkout-sidebar">
              <div className="summary-card">
                <h2>Order Summary</h2>
                
                <div className="summary-rows">
                  <div className="row">
                    <span>Program Fee</span>
                    <span>{price > 0 ? `₹${price.toLocaleString('en-IN')}` : 'FREE'}</span>
                  </div>
                  <div className="row">
                    <span>Platform Access</span>
                    <span className="free">FREE</span>
                  </div>
                  <div className="row">
                    <span>GST (Inclusive)</span>
                    <span>₹0</span>
                  </div>
                </div>

                <div className="total-row">
                  <span>Total Amount</span>
                  <span className="amount">{price > 0 ? `₹${price.toLocaleString('en-IN')}` : 'FREE'}</span>
                </div>

                <div className="sidebar-faq">
                  <h5>Common Questions</h5>
                  <div className="sidebar-faq-item">
                    <h6>Is there a certificate?</h6>
                    <p>Yes, you get a verified digital certificate upon completion.</p>
                  </div>
                  <div className="sidebar-faq-item">
                    <h6>Lifetime access?</h6>
                    <p>Absolutely. You keep access to all future updates too.</p>
                  </div>
                </div>

                {error && (
                  <div className="error-box">
                    <p>{error}</p>
                    {(error.toLowerCase().includes('not configured') || error.toLowerCase().includes('initiate')) && (
                      <button onClick={handleManualEnroll} className="btn-manual">
                        Try Manual Enrollment (Dev Mode)
                      </button>
                    )}
                  </div>
                )}

                <button 
                  onClick={handlePay} 
                  disabled={processing}
                  className={`btn-pay ${processing ? 'loading' : ''}`}
                >
                  {processing ? 'Processing...' : price > 0 ? `Secure Payment • ₹${price.toLocaleString('en-IN')}` : 'Enroll for Free Now'}
                </button>

                <div className="secure-logos">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Razorpay_logo.svg" alt="Razorpay" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" />
                </div>

                <p className="legal-text">
                  By enrolling, you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.
                </p>
              </div>

              <div className="mentor-sidebar-card">
                <h5>Program Mentors</h5>
                <div className="mentor-profile-item">
                  <div className="mentor-avatar-lg">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor || 'Lead Mentor')}&background=C5975B&color=fff`} alt="Lead Mentor" />
                  </div>
                  <div className="mentor-details">
                    <h6>{course.instructor || 'Lead Startup Mentor'}</h6>
                    <p>India&apos;s leading venture builders with 15+ years of experience in scaling unicorns.</p>
                    <div className="mentor-stats">
                      <span>500+ Mentees</span>
                      <span>•</span>
                      <span>₹50Cr Raised</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <div className="community-cta">
            <div className="cta-grid">
              <div className="cta-stat">
                <span className="stat-value">10,000+</span>
                <span className="stat-label">Active Founders</span>
              </div>
              <div className="cta-stat">
                <span className="stat-value">500+</span>
                <span className="stat-label">Startups Launched</span>
              </div>
              <div className="cta-stat">
                <span className="stat-value">₹50Cr+</span>
                <span className="stat-label">Funding Raised</span>
              </div>
            </div>
          </div>

          <div className="faq-section">
            <h3>Frequently Asked Questions</h3>
            <div className="faq-grid">
              {[
                { q: 'Is there a certificate?', a: 'Yes, you receive a verified digital certificate upon completion of all modules and assignments.' },
                { q: 'Can I access this later?', a: 'You get lifetime access to all recorded sessions, toolkits, and future updates to this program.' },
                { q: 'Is this for beginners?', a: 'Absolutely. We start from the absolute fundamentals of problem identification and idea validation.' },
                { q: 'What is the refund policy?', a: 'We offer a 7-day no-questions-asked refund policy if you find the content doesn\'t suit your needs.' }
              ].map((faq, i) => (
                <div key={i} className="faq-item">
                  <h6>{faq.q}</h6>
                  <p>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .checkout-container {
          min-height: 100vh;
          background: #f8fafc;
          padding-bottom: 6rem;
          font-family: 'Inter', sans-serif;
        }

        .checkout-hero {
          background: linear-gradient(135deg, #4A0F18 0%, #7A1F2B 50%, #922538 100%);
          padding: 4rem 2rem 8rem;
          color: #fff;
          position: relative;
          overflow: hidden;
        }
        .checkout-hero::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: url('https://www.transparenttextures.com/patterns/carbon-fibre.png');
          opacity: 0.1;
        }
        .hero-inner { max-width: 1400px; margin: 0 auto; position: relative; z-index: 1; }
        .hero-back { 
          display: inline-flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.8); 
          text-decoration: none; font-size: 0.9rem; font-weight: 700; margin-bottom: 2.5rem;
          padding: 8px 16px; border-radius: 12px; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
          transition: 0.2s;
        }
        .hero-back:hover { color: #fff; background: rgba(255,255,255,0.2); transform: translateX(-4px); }
        .hero-badge { 
          display: inline-block; padding: 6px 14px; background: #C5975B; color: #fff; 
          border-radius: 8px; font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;
          margin-bottom: 1.5rem; box-shadow: 0 4px 15px rgba(197, 151, 91, 0.4);
        }
        .hero-title { font-size: 3rem; font-weight: 900; letter-spacing: -0.04em; margin-bottom: 1rem; line-height: 1.1; color: #fff; }
        .hero-subtitle { font-size: 1.25rem; opacity: 0.8; max-width: 600px; line-height: 1.6; font-weight: 500; }

        .checkout-inner {
          max-width: 1400px;
          margin: -5rem auto 0;
          padding: 0 2rem;
          position: relative;
          z-index: 10;
        }
        .checkout-grid {
          display: grid;
          grid-template-columns: 1fr 440px;
          gap: 3rem;
          align-items: start;
        }

        .checkout-card {
          background: #fff;
          border-radius: 32px;
          padding: 3rem;
          border: 1px solid rgba(0,0,0,0.05);
          box-shadow: 0 20px 50px rgba(0,0,0,0.05);
          margin-bottom: 3rem;
        }

        .program-preview-premium { display: flex; gap: 2rem; margin-bottom: 2.5rem; }
        .premium-thumb { 
          width: 200px; height: 160px; border-radius: 24px; overflow: hidden; position: relative; 
          box-shadow: 0 15px 30px rgba(0,0,0,0.1); border: 4px solid #fff; flex-shrink: 0;
        }
        .premium-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .thumb-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.4), transparent); }
        
        .premium-details { display: flex; flex-direction: column; justify-content: center; }
        .premium-category { color: #C5975B; font-weight: 900; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
        .premium-details h3 { font-size: 2rem; font-weight: 900; color: #0f172a; margin-bottom: 15px; letter-spacing: -0.02em; line-height: 1.2; }
        .premium-meta { display: flex; align-items: center; gap: 12px; }
        .meta-item { display: flex; align-items: center; gap: 6px; font-size: 0.9rem; color: #64748b; font-weight: 600; }
        .meta-sep { color: #e2e8f0; }

        .program-description { font-size: 1.1rem; line-height: 1.7; color: #475569; margin-bottom: 3rem; font-weight: 500; }

        .value-props { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 1rem; }
        .prop-card { padding: 1.5rem; background: #f8fafc; border-radius: 24px; border: 1.5px solid #f1f5f9; transition: 0.3s; }
        .prop-card:hover { transform: translateY(-5px); border-color: #7A1F2B; background: #fff; }
        .prop-icon { font-size: 2rem; margin-bottom: 12px; }
        .prop-card h6 { font-size: 1rem; font-weight: 800; color: #1e293b; margin-bottom: 8px; }
        .prop-card p { font-size: 0.85rem; color: #64748b; line-height: 1.5; margin: 0; font-weight: 500; }

        .benefits-section { background: #fdf8f0; padding: 2rem; border-radius: 28px; border: 1.5px solid #f3e8d7; margin-top: 3rem; }
        .benefits-section h4 { font-size: 1.1rem; font-weight: 900; color: #111827; margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .benefits-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        .benefit-item { display: flex; align-items: center; gap: 12px; font-size: 0.95rem; color: #1e293b; font-weight: 700; }
        .benefit-icon { width: 24px; height: 24px; background: #7A1F2B; color: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.7rem; }

        .syllabus-preview { margin-top: 4rem; }
        .syllabus-header h4 { font-size: 1.5rem; font-weight: 900; color: #111827; margin-bottom: 2rem; }
        .syllabus-list { display: flex; flex-direction: column; gap: 16px; }
        .syllabus-item-detailed { padding: 1.5rem; background: #fff; border: 1.5px solid #f1f5f9; border-radius: 24px; transition: 0.2s; }
        .syllabus-item-detailed:hover { border-color: #7A1F2B; box-shadow: 0 10px 30px rgba(122,31,43,0.05); }
        .syllabus-item-header { display: flex; align-items: center; gap: 15px; margin-bottom: 10px; }
        .syllabus-item-header .index { color: #C5975B; font-weight: 900; font-family: monospace; font-size: 1.1rem; }
        .syllabus-item-header .text { font-size: 1.1rem; font-weight: 800; color: #1e293b; }
        .syllabus-item-desc { font-size: 0.95rem; color: #64748b; line-height: 1.6; margin: 0; padding-left: 35px; font-weight: 500; }

        .founder-quote-card { background: #1e293b; border-radius: 32px; padding: 3rem; color: #fff; position: relative; overflow: hidden; margin-top: 3rem; }
        .quote-icon { position: absolute; top: -20px; left: 20px; font-size: 10rem; opacity: 0.1; color: #fff; font-family: serif; }
        .quote-text { font-size: 1.4rem; font-weight: 600; line-height: 1.6; margin-bottom: 2rem; position: relative; z-index: 1; font-style: italic; color: #cbd5e1; }
        .founder-info { display: flex; align-items: center; gap: 16px; position: relative; z-index: 1; }
        .founder-avatar-mini { width: 56px; height: 56px; border-radius: 50%; border: 3px solid #7A1F2B; overflow: hidden; }
        .founder-name { font-size: 1.1rem; font-weight: 800; display: block; }
        .founder-title { font-size: 0.85rem; opacity: 0.6; display: block; }

        .community-cta { background: #fff; border-radius: 40px; padding: 5rem 2rem; border: 1px solid #f1f5f9; text-align: center; margin: 6rem auto 2rem; max-width: 1200px; box-shadow: 0 10px 40px rgba(0,0,0,0.02); }
        .cta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4rem; }
        .stat-value { font-size: 3rem; font-weight: 900; color: #7A1F2B; display: block; margin-bottom: 8px; letter-spacing: -0.04em; }
        .stat-label { font-size: 0.9rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; }

        .faq-section { margin-top: 8rem; max-width: 1000px; margin-left: auto; margin-right: auto; padding-bottom: 4rem; }
        .faq-section h3 { font-size: 2.25rem; font-weight: 900; color: #111827; margin-bottom: 3.5rem; text-align: center; letter-spacing: -0.02em; }
        .faq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        .faq-item { padding: 2rem; background: #fff; border-radius: 24px; border: 1.5px solid #f1f5f9; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
        .faq-item h6 { font-size: 1.1rem; font-weight: 800; color: #1e293b; margin-bottom: 12px; }
        .faq-item p { font-size: 0.95rem; color: #64748b; line-height: 1.6; margin: 0; font-weight: 500; }

        .summary-card {
          background: #fff; border-radius: 32px; padding: 3rem; border: 1px solid #7A1F2B;
          box-shadow: 0 30px 60px rgba(122,31,43,0.1); position: sticky; top: 2rem;
        }
        .sidebar-faq { margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #f1f5f9; }
        .sidebar-faq h5 { font-size: 0.9rem; font-weight: 800; color: #1e293b; margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .sidebar-faq-item { margin-bottom: 1.25rem; }
        .sidebar-faq-item h6 { font-size: 0.85rem; font-weight: 700; color: #111827; margin-bottom: 4px; }
        .sidebar-faq-item p { font-size: 0.8rem; color: #64748b; line-height: 1.5; margin: 0; }

        .summary-card h2 { font-size: 1.6rem; font-weight: 900; color: #111827; margin-bottom: 2.5rem; letter-spacing: -0.02em; }
        .summary-rows { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2.5rem; }
        .row { display: flex; justify-content: space-between; font-size: 1.05rem; color: #475569; font-weight: 600; }
        .row .free { color: #059669; font-weight: 800; background: #ecfdf5; padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; }
        .total-row { display: flex; justify-content: space-between; align-items: center; padding-top: 2rem; border-top: 2px dashed #f1f5f9; margin-bottom: 3rem; }
        .total-row span { font-size: 1.25rem; font-weight: 900; color: #111827; }
        .total-row .amount { font-size: 2.75rem; font-weight: 900; color: #7A1F2B; letter-spacing: -0.05em; }

        .btn-pay {
          width: 100%; padding: 1.6rem; background: #7A1F2B; color: #fff; border: none; border-radius: 24px;
          font-size: 1.2rem; font-weight: 900; cursor: pointer; transition: 0.3s; box-shadow: 0 15px 30px rgba(122,31,43,0.3);
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .btn-pay:hover { background: #922538; transform: translateY(-4px); box-shadow: 0 20px 40px rgba(122,31,43,0.4); }

        .secure-logos { display: flex; justify-content: center; gap: 2rem; margin-top: 2.5rem; opacity: 0.5; }
        .secure-logos img { height: 24px; }

        .mentor-sidebar-card {
          background: #fff; border-radius: 32px; padding: 2.5rem; margin-top: 2rem;
          border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 10px 30px rgba(0,0,0,0.02);
        }
        .mentor-sidebar-card h5 { font-size: 0.9rem; font-weight: 800; color: #1e293b; margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .mentor-profile-item { display: flex; gap: 20px; }
        .mentor-avatar-lg { width: 64px; height: 64px; border-radius: 50%; overflow: hidden; border: 3px solid #f1f5f9; flex-shrink: 0; }
        .mentor-details h6 { font-size: 1.1rem; font-weight: 800; color: #111827; margin-bottom: 6px; }
        .mentor-details p { font-size: 0.85rem; color: #64748b; line-height: 1.5; margin-bottom: 12px; font-weight: 500; }
        .mentor-stats { display: flex; gap: 10px; font-size: 0.75rem; color: #C5975B; font-weight: 700; text-transform: uppercase; }

        @media (max-width: 1200px) {
          .checkout-grid { grid-template-columns: 1fr; }
          .summary-card { position: static; margin-top: 3rem; }
          .faq-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .checkout-hero { padding: 3rem 1.5rem 6rem; }
          .hero-title { font-size: 2rem; }
          .hero-back { margin-bottom: 1.5rem; font-size: 0.8rem; }
          .value-props { grid-template-columns: 1fr; }
          .cta-grid { grid-template-columns: 1fr; gap: 2rem; }
          .premium-thumb { width: 100%; height: 200px; }
          .program-preview-premium { flex-direction: column; }
        }
      `}</style>
    </>
  );
}
