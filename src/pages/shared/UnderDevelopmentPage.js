import { Construction, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Breadcrumbs from '../../components/ui/Breadcrumbs';

export default function UnderDevelopmentPage() {
  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[{ label: 'لوحة التحكم', href: '/dashboard' }, { label: 'قيد التطوير' }]} />

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-warning-light flex items-center justify-center mb-6">
          <Construction className="w-10 h-10 text-warning" />
        </div>
        <h1 className="text-2xl font-bold text-heading mb-3">هذه الصفحة قيد التطوير</h1>
        <p className="text-muted max-w-md mb-2">
          نعمل حالياً على تطوير هذا القسم وسيتم إضافته قريباً.
          شكراً لصبركم.
        </p>
        <p className="text-sm text-muted mb-8">سيتم إضافتها قريباً</p>
        <Link to="/dashboard">
          <Button variant="outline" icon={ArrowRight}>
            العودة للوحة التحكم
          </Button>
        </Link>
      </div>
    </div>
  );
}
