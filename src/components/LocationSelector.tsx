
import { useState } from "react";
import { MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Location = "matriz" | "filial";

interface LocationData {
  title: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
}

export const locationData: Record<Location, LocationData> = {
  matriz: {
    title: "Matriz - BA",
    address: "Rua Comendador Gomes, 265 - Tomba",
    city: "Feira de Santana",
    state: "BA",
    zip: "44091-238",
    phone: "(75) 98122-2015",
    email: "atendimento@fptranscargas.com.br"
  },
  filial: {
    title: "Filial - SP",
    address: "Rua Gurjão, 12 - Cidade Industrial Satélite",
    city: "Guarulhos",
    state: "SP",
    zip: "07224-040",
    phone: "(11) 2859-8420",
    email: "atendimento@fptranscargas.com.br"
  }
};

interface LocationSelectorProps {
  selectedLocation: Location;
  onLocationChange: (location: Location) => void;
  variant?: "default" | "tabs";
  className?: string;
}

export const LocationSelector = ({
  selectedLocation,
  onLocationChange,
  variant = "default",
  className = ""
}: LocationSelectorProps) => {
  if (variant === "tabs") {
    return (
      <div className={`flex rounded-lg overflow-hidden border border-gray-200 ${className}`}>
        {Object.keys(locationData).map((loc) => (
          <button
            key={loc}
            onClick={() => onLocationChange(loc as Location)}
            className={`flex-1 py-3 px-4 font-medium text-center transition-colors ${
              selectedLocation === loc
                ? "bg-corporate-600 text-white"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {locationData[loc as Location].title}
          </button>
        ))}
      </div>
    );
  }
  
  return (
    <div className={`flex gap-2 ${className}`}>
      {Object.keys(locationData).map((loc) => (
        <Button
          key={loc}
          onClick={() => onLocationChange(loc as Location)}
          variant={selectedLocation === loc ? "default" : "outline"}
          className={selectedLocation === loc ? "bg-corporate-600 hover:bg-corporate-700" : ""}
        >
          <MapPin className="mr-2 h-4 w-4" />
          {locationData[loc as Location].title}
        </Button>
      ))}
    </div>
  );
};

export const LocationInfo = ({ 
  location, 
  showTitle = false,
  showIcon = true,
  iconSize = 18,
  className = ""
}: { 
  location: Location, 
  showTitle?: boolean,
  showIcon?: boolean,
  iconSize?: number,
  className?: string
}) => {
  const data = locationData[location];

  return (
    <div className={`space-y-4 ${className}`}>
      {showTitle && (
        <h3 className="font-bold text-xl text-gray-900 mb-4 tracking-tight">
          {data.title}
        </h3>
      )}
      
      {/* Endereço */}
      <div className="flex items-start gap-3 group">
        {showIcon && (
          <div className="flex-shrink-0 p-2 bg-corporate-50 text-corporate-600 rounded-lg group-hover:bg-corporate-100 transition-colors">
            <MapPin size={iconSize} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm mb-1">Endereço</h4>
          <p className="text-gray-700 leading-relaxed text-sm">
            <span className="block font-medium">{data.address}</span>
            <span className="block">{data.city} - {data.state}</span>
            <span className="block text-gray-600">CEP: {data.zip}</span>
          </p>
        </div>
      </div>
      
      {/* Telefone */}
      <div className="flex items-start gap-3 group">
        {showIcon && (
          <div className="flex-shrink-0 p-2 bg-corporate-50 text-corporate-600 rounded-lg group-hover:bg-corporate-100 transition-colors">
            <Phone size={iconSize} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm mb-1">Telefone</h4>
          <p className="text-gray-700 text-sm font-medium">
            {data.phone}
          </p>
        </div>
      </div>
      
      {/* Email */}
      <div className="flex items-start gap-3 group">
        {showIcon && (
          <div className="flex-shrink-0 p-2 bg-corporate-50 text-corporate-600 rounded-lg group-hover:bg-corporate-100 transition-colors">
            <Mail size={iconSize} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm mb-1">E-mail</h4>
          <p className="text-gray-700 text-sm font-medium break-all">
            {data.email}
          </p>
        </div>
      </div>
    </div>
  );
};
