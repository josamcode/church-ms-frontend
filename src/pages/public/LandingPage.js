import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  Shield, Zap, Database, Puzzle, LogIn, ChevronDown, ChevronUp,
  Users, Lock, BarChart3, Settings, ArrowLeft,
} from 'lucide-react';
import Button from '../../components/ui/Button';

const features = [
  {
    icon: Database,
    title: 'إدارة البيانات',
    desc: 'إدارة شاملة لبيانات الأعضاء والعائلات مع سجل مراجعة كامل لكل تغيير',
  },
  {
    icon: Shield,
    title: 'الصلاحيات والأمان',
    desc: 'نظام صلاحيات متقدم يعتمد على الأدوار مع تشفير كامل للبيانات الحساسة',
  },
  {
    icon: Zap,
    title: 'سرعة الأداء',
    desc: 'مصمم للتعامل مع ملايين السجلات بأداء عالٍ وزمن استجابة أقل من 200 مللي ثانية',
  },
  {
    icon: Puzzle,
    title: 'قابلية التوسع',
    desc: 'بنية معمارية قابلة للتوسع لإضافة وحدات جديدة بسهولة دون التأثير على النظام',
  },
];

const steps = [
  { num: '1', icon: Users, title: 'تسجيل الأعضاء', desc: 'إضافة بيانات الأعضاء والعائلات بسهولة' },
  { num: '2', icon: Lock, title: 'تعيين الصلاحيات', desc: 'تحديد الأدوار والصلاحيات لكل مستخدم' },
  { num: '3', icon: BarChart3, title: 'متابعة البيانات', desc: 'تصفح وإدارة البيانات بفلاتر متقدمة' },
  { num: '4', icon: Settings, title: 'إدارة متكاملة', desc: 'ربط العائلات والوسوم والخدمات' },
];

const faqs = [
  { q: 'ما هو نظام إدارة الكنيسة؟', a: 'نظام متكامل لإدارة بيانات أعضاء الكنيسة والعائلات والخدمات والاجتماعات. مبني بأحدث التقنيات لضمان الأمان والسرعة.' },
  { q: 'هل النظام آمن؟', a: 'نعم، النظام يستخدم تشفير متقدم لكلمات المرور، رموز مصادقة مؤقتة، ونظام صلاحيات صارم. جميع البيانات الحساسة محمية.' },
  { q: 'هل يمكن إضافة خدمات جديدة لاحقاً؟', a: 'بالتأكيد، النظام مصمم بمعمارية قابلة للتوسع. يمكن إضافة وحدات جديدة مثل الاعتراف والاجتماعات والحضور دون التأثير على الوحدات الحالية.' },
  { q: 'من يمكنه استخدام النظام؟', a: 'النظام يدعم ثلاثة أدوار: مدير النظام بجميع الصلاحيات، المسؤول بصلاحيات إدارة المستخدمين، والمستخدم العادي بصلاحيات محدودة لحسابه الشخصي.' },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div key={i} className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between p-4 text-right hover:bg-surface-alt transition-colors"
          >
            <span className="font-medium text-heading">{faq.q}</span>
            {openIndex === i ? (
              <ChevronUp className="w-5 h-5 text-muted flex-shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted flex-shrink-0" />
            )}
          </button>
          {openIndex === i && (
            <div className="px-4 pb-4 text-sm text-muted animate-fade-in">{faq.a}</div>
          )}
        </div>
      ))}
    </div>
  );
}

const stats = [
  { label: 'عضو نشط', value: '+500' },
  { label: 'عائلة مسجلة', value: '+120' },
  { label: 'نقطة نهاية API', value: '16' },
  { label: 'صلاحية متاحة', value: '15' },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-primary/5 via-transparent to-secondary/5">
        <div className="page-container py-20 md:py-28 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-heading leading-tight mb-6">
            نظام إدارة متكامل
            <br />
            <span className="text-primary">لكنيسة الملاك ميخائيل</span>
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto mb-8">
            منصة رقمية حديثة لإدارة بيانات الأعضاء والعائلات والخدمات.
            مبنية بأعلى معايير الأمان والأداء.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth/login">
              <Button size="lg" icon={LogIn}>
                تسجيل الدخول
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" icon={ArrowLeft} iconPosition="end">
                اكتشف المزيد
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
            {stats.map((s, i) => (
              <div key={i} className="bg-surface rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-primary">{s.value}</div>
                <div className="text-xs text-muted mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-surface">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-heading mb-3">مميزات النظام</h2>
            <p className="text-muted max-w-lg mx-auto">
              نظام مصمم بعناية لتلبية احتياجات إدارة الكنيسة بأفضل التقنيات
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-page rounded-lg border border-border p-6 text-center hover:shadow-dropdown transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-heading mb-2">{f.title}</h3>
                <p className="text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-heading mb-3">كيف يعمل النظام</h2>
            <p className="text-muted max-w-lg mx-auto">خطوات بسيطة للبدء في استخدام النظام</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-xs text-primary font-bold mb-1">الخطوة {step.num}</div>
                <h3 className="font-bold text-heading mb-1">{step.title}</h3>
                <p className="text-sm text-muted">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-surface">
        <div className="page-container max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-heading mb-3">الأسئلة الشائعة</h2>
          </div>
          <FAQ />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-white">
        <div className="page-container text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">ابدأ باستخدام النظام الآن</h2>
          <p className="text-white/80 max-w-lg mx-auto mb-8">
            سجّل دخولك وابدأ بإدارة بيانات الكنيسة بطريقة منظمة وآمنة
          </p>
          <Link to="/auth/login">
            <Button variant="outline" size="lg" className="!border-white !text-white hover:!bg-white/10">
              تسجيل الدخول
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
