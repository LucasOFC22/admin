import logoFpTranscargas from '@/assets/logo-fptranscargas.png';

interface OptimizedAuthSpinnerProps {
  message?: string;
  minimal?: boolean;
}

const OptimizedAuthSpinner = ({ minimal = false }: OptimizedAuthSpinnerProps) => {
  if (minimal) {
    return (
      <div className="flex items-center justify-center min-h-[60px]">
        <img src={logoFpTranscargas} alt="FP Transcargas" className="h-8 w-auto animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <img
        src={logoFpTranscargas}
        alt="FP Transcargas"
        className="h-16 w-auto animate-pulse"
      />
    </div>
  );
};

export default OptimizedAuthSpinner;
