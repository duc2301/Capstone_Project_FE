import type { TaxCodeLookupResult } from '../model/organization.types';

const VIETQR_BUSINESS_URL = 'https://api.vietqr.io/v2/business';

export const TAX_CODE_MIN_LENGTH = 10;
export const TAX_CODE_MAX_LENGTH = 13;

interface RawBusiness {
  id?: string | null;
  name?: string | null;
  internationalName?: string | null;
  shortName?: string | null;
  address?: string | null;
}

export type TaxCodeLookupOutcome =
  | { status: 'found'; data: TaxCodeLookupResult }
  | { status: 'notFound' }
  | { status: 'unavailable' };

export async function lookupTaxCode(taxCode: string): Promise<TaxCodeLookupOutcome> {
  const code = taxCode.trim();
  if (code.length < TAX_CODE_MIN_LENGTH) return { status: 'notFound' };

  try {
    const response = await fetch(`${VIETQR_BUSINESS_URL}/${encodeURIComponent(code)}`);
    if (!response.ok) return { status: 'unavailable' };

    const body = (await response.json()) as { code?: string; data?: RawBusiness | null };
    if (body.code !== '00' || !body.data) return { status: 'notFound' };

    return {
      status: 'found',
      data: {
        taxCode: body.data.id ?? code,
        legalName: body.data.name ?? '',
        internationalName: body.data.internationalName ?? '',
        shortName: body.data.shortName ?? '',
        address: body.data.address ?? '',
      },
    };
  } catch {
    return { status: 'unavailable' };
  }
}
