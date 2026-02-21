import React from 'react';
import { Helmet } from 'react-helmet-async';

interface OrganizationData {
  name: string;
  description: string;
  url: string;
  logo: string;
  telephone: string;
  email: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  sameAs: string[];
}

interface StructuredDataProps {
  type: 'organization' | 'service' | 'breadcrumb' | 'faq';
  data: any;
}

const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
  const generateStructuredData = () => {
    const baseUrl = 'https://fptranscargas.com.br';
    
    switch (type) {
      case 'organization':
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "FP Transcargas",
          "description": "Empresa de transporte rodoviário e logística com mais de 15 anos de experiência no mercado brasileiro.",
          "url": baseUrl,
          "logo": `${baseUrl}/imags/logo.png`,
          "telephone": "+55-77-99999-9999",
          "email": "contato@fptranscargas.com.br",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Rua Principal, 123",
            "addressLocality": "Vitória da Conquista",
            "addressRegion": "BA",
            "postalCode": "45000-000",
            "addressCountry": "BR"
          },
          "sameAs": [
            "https://facebook.com/fptranscargas",
            "https://instagram.com/fptranscargas"
          ],
          "priceRange": "$$",
          "serviceArea": {
            "@type": "Country",
            "name": "Brasil"
          },
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Serviços de Transporte",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Entrega Expressa",
                  "description": "Serviço de entrega rápida para cargas urgentes"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Carga Fracionada",
                  "description": "Transporte de cargas pequenas e médias"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Transporte Rodoviário",
                  "description": "Transporte completo por rodovia"
                }
              }
            ]
          }
        };

      case 'service':
        return {
          "@context": "https://schema.org",
          "@type": "Service",
          "name": data.name,
          "description": data.description,
          "provider": {
            "@type": "Organization",
            "name": "FP Transcargas",
            "url": baseUrl
          },
          "serviceType": "Transporte e Logística",
          "areaServed": {
            "@type": "Country",
            "name": "Brasil"
          }
        };

      case 'breadcrumb':
        return {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": data.map((item: any, index: number) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url
          }))
        };

      case 'faq':
        return {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": data.map((faq: any) => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.answer
            }
          }))
        };

      default:
        return null;
    }
  };

  const structuredData = generateStructuredData();

  if (!structuredData) return null;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default StructuredData;