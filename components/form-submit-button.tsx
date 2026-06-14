'use client';

import { useFormStatus } from 'react-dom';

type FormSubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  className?: string;
};

export function FormSubmitButton({ label, pendingLabel, className = '' }: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel ?? label : label}
    </button>
  );
}
