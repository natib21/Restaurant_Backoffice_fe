import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from '../Components/LoginForm';
import { useLoginMutation } from '../../../api/Queries/authQueries';
import { UtensilsCrossed, Sparkles, TrendingUp, Gift, ArrowRight } from 'lucide-react';

const CAROUSEL_SLIDES = [
  {
    image:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200',
    title: 'Elevate Your Dining Experience',
    subtitle:
      'The ultimate command center for modern hospitality. Manage your restaurant with precision and elegance.',
    badge: 'Multi-Branch Management',
  },
  {
    image:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
    title: 'Real-Time Operational Intelligence',
    subtitle:
      'Track live orders, sales performance, and Telegram customer engagement across all your branches seamlessly.',
    badge: 'Automated CRM & Bot',
  },
];

export default function LoginPage() {
  const loginMutation = useLoginMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      await loginMutation.mutateAsync(values);
      navigate(from, { replace: true });
    } catch {
      // Error handled inside LoginForm / serverError prop
    }
  };

  return (
    <div className="min-h-screen w-screen overflow-x-hidden flex bg-white">
      {/* Left Form Panel - Toast Central Authentication Card Style */}
    

      {/* Right Brand Showcase Side - Toast Dark Theme Dual-Image / Promotional Splash */}
      <section className="hidden lg:flex flex-1 min-h-screen relative overflow-hidden bg-[#1a1f2c] flex-col justify-between p-12 text-white">
        {/* Carousel Background Images */}
        {CAROUSEL_SLIDES.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1f2c] via-[#1a1f2c]/80 to-transparent" />
          </div>
        ))}

        {/* Top Right Floating Brand Header */}
        <div className="relative z-20 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-xs font-semibold text-orange-300">
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            <span>{CAROUSEL_SLIDES[currentSlide].badge}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-sm text-slate-300">
              Secure Central Gateway
            </span>
          </div>
        </div>

        {/* Floating Stat Widget in Carousel */}
        <div className="relative z-20 max-w-xs ml-auto my-auto p-4 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/10 space-y-2 shadow-2xl">
          <div className="flex items-center gap-2 text-xs text-orange-400 font-semibold">
            <TrendingUp className="h-4 w-4" />
            <span>Live Analytics Active</span>
          </div>
          <p className="text-xl font-bold text-white">ETB 145,200</p>
          <p className="text-[11px] text-slate-300">
            Daily processed orders across connected branches
          </p>
        </div>

        {/* Bottom Overlay Slide Content & Referral Promotion Banner */}
        <div className="relative z-20 max-w-xl space-y-6 pt-8">
          <div className="space-y-3">
            <h3 className="text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-md">
              {CAROUSEL_SLIDES[currentSlide].title}
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
              {CAROUSEL_SLIDES[currentSlide].subtitle}
            </p>
          </div>

          {/* Referral Promo Bottom Banner Design */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/20 via-slate-900/95 to-slate-900/95 backdrop-blur-md border border-orange-500/30 flex items-center justify-between gap-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0 mt-0.5">
                <Gift className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500 text-slate-950">
                    US Only
                  </span>
                  <p className="text-xs font-semibold text-orange-300">Stack an extra $500!</p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Refer a fellow operator by August 15 to secure your standard payout + an extra $500. Plus, each referral triggers a $5 donation to No Kid Hungry.
                </p>
              </div>
            </div>
            <a
              href="#refer"
              onClick={(e) => e.preventDefault()}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-bold transition-all shadow-lg hover:shadow-orange-500/25"
            >
              <span>Refer and Earn</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Slide Indicators */}
          <div className="flex items-center gap-2 pt-2">
            {CAROUSEL_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentSlide
                    ? 'w-8 bg-orange-500'
                    : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>
        <section className="w-full lg:w-[480px] xl:w-[520px] bg-white min-h-screen flex flex-col justify-between p-8 sm:p-12 z-10 border-r border-slate-100 shadow-xl lg:shadow-none">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5  bg-primary text-white shadow-md shadow-orange-500/20">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-slate-900">
              <span className="text-sm font-semibold tracking-tight text-foreground hidden sm:inline-block">
                Tiru<span className="text-primary">Solutions</span>
              </span>
            </h1>
            <p className="text-[10px] font-bold tracking-wider text-primary uppercase">
               Addis Ababa, Ethiopia
            </p>
          </div>
        </div>

        {/* Center Form Container Card */}
        <div className="w-full max-w-sm mx-auto my-auto py-6 space-y-6">
          <header className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Log in to Tiru
            </h2>
            <p className="text-sm text-slate-500">
              Enter your credentials to access your restaurant network
            </p>
          </header>

          <LoginForm
            onSubmit={handleSubmit}
            isPending={loginMutation.isPending}
            serverError={
              loginMutation.isError ? 'Invalid email or password' : undefined
            }
          />

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <Link
                to="/sign-up"
                className="font-bold text-[#ff6d00] hover:text-[#e06000] transition-colors underline underline-offset-2"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[11px] text-slate-400 text-center sm:text-left pt-4">
          &copy; {new Date().getFullYear()} TiruSolutions. Powered by enterprise auth.
        </div>
      </section>
    </div>
  );
}