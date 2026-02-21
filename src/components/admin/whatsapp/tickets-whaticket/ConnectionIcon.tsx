import React from 'react';
import { FaWhatsapp, FaFacebookF, FaInstagram } from 'react-icons/fa';

interface ConnectionIconProps {
  channel?: string;
  className?: string;
  width?: number;
  height?: number;
}

export const ConnectionIcon: React.FC<ConnectionIconProps> = ({
  channel = 'whatsapp',
  className = '',
  width = 16,
  height = 16
}) => {
  const iconStyle = { width, height };

  switch (channel) {
    case 'facebook':
      return (
        <FaFacebookF 
          className={className}
          style={{ ...iconStyle, color: '#4267B2', verticalAlign: 'middle' }}
        />
      );
    case 'instagram':
      return (
        <FaInstagram 
          className={className}
          style={{ ...iconStyle, color: '#E1306C', verticalAlign: 'middle' }}
        />
      );
    case 'whatsapp':
    default:
      return (
        <FaWhatsapp 
          className={className}
          style={{ ...iconStyle, color: '#25D366', verticalAlign: 'middle' }}
        />
      );
  }
};
