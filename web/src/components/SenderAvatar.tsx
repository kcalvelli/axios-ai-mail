/**
 * SenderAvatar component - Display sender avatar with Gravatar or initials fallback
 */

import { useState } from 'react';
import { Avatar } from '@mui/material';
import md5 from 'md5';

interface SenderAvatarProps {
  email: string;
  name?: string;
  size?: number;
}

// Generate a consistent color based on email hash
const getAvatarColor = (email: string): string => {
  const colors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7',
    '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
    '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
    '#FFC107', '#FF9800', '#FF5722', '#795548',
  ];
  const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// Extract initials from name or email
const getInitials = (email: string, name?: string): string => {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  }
  // Use first letter of email local part
  const localPart = email.split('@')[0];
  return localPart[0].toUpperCase();
};

// Extract name from "Name <email>" format
export const extractSenderName = (fromEmail: string): { name: string; email: string } => {
  const match = fromEmail.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^["']|["']$/g, ''), email: match[2] };
  }
  return { name: '', email: fromEmail };
};

export function SenderAvatar({ email, name, size = 40 }: SenderAvatarProps) {
  const [gravatarFailed, setGravatarFailed] = useState(false);

  // Generate Gravatar URL
  const emailHash = md5(email.toLowerCase().trim());
  const gravatarUrl = `https://www.gravatar.com/avatar/${emailHash}?d=404&s=${size * 2}`;

  const initials = getInitials(email, name);
  const bgColor = getAvatarColor(email);

  if (gravatarFailed) {
    // Show initials fallback
    return (
      <Avatar
        sx={{
          width: size,
          height: size,
          fontSize: size * 0.4,
          bgcolor: bgColor,
          color: '#fff',
        }}
      >
        {initials}
      </Avatar>
    );
  }

  return (
    <Avatar
      src={gravatarUrl}
      onError={() => setGravatarFailed(true)}
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        bgcolor: bgColor,
        color: '#fff',
      }}
    >
      {initials}
    </Avatar>
  );
}
