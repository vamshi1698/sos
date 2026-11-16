import Home3DHero from '@/components/home/Home3DHero';
import type { View } from '@/types';

interface HomePageProps {
  onNavigate: (view: View) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  return <Home3DHero onNavigate={onNavigate} />;
}
