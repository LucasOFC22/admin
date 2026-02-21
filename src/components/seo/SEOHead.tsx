import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'FP Transcargas - Transporte e Logística Confiável',
  description = 'Transporte rodoviário e logística com mais de 15 anos de experiência. Entrega expressa, carga fracionada e soluções personalizadas em todo o Brasil.',
  keywords = 'transporte, logística, frete, carga, entrega expressa, transporte rodoviário, cotação online',
  image = 'https://fptranscargas.com.br/imags/logo.png',
  url = 'https://fptranscargas.com.br',
  type = 'website',
  noindex = false
}) => {
  const fullTitle = title.includes('FP Transcargas') ? title : `${title} | FP Transcargas`;

  return (
    <Helmet>
      {/* Título otimizado */}
      <title>{fullTitle}</title>
      
      {/* Meta tags básicas */}
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="FP Transcargas" />
      
      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="FP Transcargas" />
      <meta property="og:locale" content="pt_BR" />
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Viewport otimizado */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    </Helmet>
  );
};

export default SEOHead;