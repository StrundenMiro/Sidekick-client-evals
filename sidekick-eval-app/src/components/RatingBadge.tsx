import type { Rating } from '@/lib/runs';

interface Props {
  rating: Rating | null;
  size?: 'sm' | 'md' | 'lg';
}

const config = {
  great: {
    label: 'Great',
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200'
  },
  good: {
    label: 'Good',
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-200'
  },
  bad: {
    label: 'Bad',
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200'
  }
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base'
};

export default function RatingBadge({ rating, size = 'md' }: Props) {
  if (!rating) {
    return (
      <span className={`${sizes[size]} rounded-full bg-gray-100 text-gray-500 font-medium`}>
        Pending
      </span>
    );
  }

  const { label, bg, text } = config[rating];

  return (
    <span className={`${sizes[size]} rounded-full ${bg} ${text} font-medium`}>
      {label}
    </span>
  );
}
