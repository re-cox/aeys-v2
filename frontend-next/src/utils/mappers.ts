import { Proposal, ProposalItem } from "@/types/proposal";

/**
 * API yanıtından gelen teklif verisini uygulama modelimize dönüştürür
 */
export function mapResponseToProposal(data: any): Proposal {
  console.log("Mapping proposal data:", data);
  
  // Müşteri verisi kontrolü
  const customerName = data.customer?.companyName || data.customer?.name || "";
  
  return {
    ...data,
    proposalNumber: data.proposalNumber || data.proposalNo || "", // proposalNo ve proposalNumber uyumluluğu
    validUntil: data.validUntil ? new Date(data.validUntil) : null,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
    customerName: customerName,
    items: Array.isArray(data.items) 
      ? data.items.map(mapResponseToProposalItem) 
      : [],
    attachments: Array.isArray(data.attachments)
      ? data.attachments.map((a: any) => ({
          ...a,
          uploadedAt: a.uploadedAt ? new Date(a.uploadedAt) : new Date()
        }))
      : []
  };
}

/**
 * API yanıtından gelen teklif kalemi verisini uygulama modelimize dönüştürür
 */
export function mapResponseToProposalItem(data: any): ProposalItem {
  return {
    ...data,
    unitPrice: typeof data.unitPrice === 'string' 
      ? Number(data.unitPrice) 
      : data.unitPrice
  };
} 