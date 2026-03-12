import { memo } from "react";
import logoFpTranscargas from '@/assets/logo-fptranscargas.png';

const PageLoader = memo(() => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <img
        src={logoFpTranscargas}
        alt="FP Transcargas"
        className="h-16 w-auto animate-pulse"
      />
    </div>
  );
});

PageLoader.displayName = "PageLoader";

export default PageLoader;
