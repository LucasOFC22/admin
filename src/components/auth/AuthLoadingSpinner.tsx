import logoFpTranscargas from '@/assets/logo-fptranscargas.png';

interface AuthLoadingSpinnerProps {
  message?: string;
}

const AuthLoadingSpinner = ({ message }: AuthLoadingSpinnerProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <img
        src={logoFpTranscargas}
        alt="FP Transcargas"
        className="h-16 w-auto animate-pulse"
      />
    </div>
  );
};

export default AuthLoadingSpinner;
