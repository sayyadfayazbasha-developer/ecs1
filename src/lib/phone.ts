export const normalizePhone = (value?: string | null) => {
  const digits = value?.replace(/\D/g, '') ?? '';

  if (!digits) {
    return null;
  }

  return `+${digits}`;
};

export const getPhoneLookupCandidates = (value: string) => {
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return [] as string[];
  }

  return Array.from(new Set([digits, `+${digits}`]));
};

export const getPhoneLoginEmailCandidates = (value: string) => {
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return [] as string[];
  }

  const candidateDigits = new Set<string>([digits]);

  // Handle country-code and local-number variants for the same phone.
  if (digits.length === 10) {
    candidateDigits.add(`91${digits}`);
  }

  if (digits.length > 10) {
    candidateDigits.add(digits.slice(-10));
  }

  if (digits.startsWith('91') && digits.length > 10) {
    candidateDigits.add(digits.slice(2));
  }

  return Array.from(candidateDigits).map((candidate) => `${candidate}@phone.local`);
};