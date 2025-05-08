import ProjectDetailsClient from '@/components/projects/ProjectDetailsClient';

// Bu sayfa sunucu tarafında render edilir ancak asıl içerik client tarafında yüklenir.
// Bileşeni async olarak işaretleyerek "params should be awaited" uyarısını gidermeyi deneyelim.
export default async function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const { id } = params;

  // Proje ID'sini client bileşenine prop olarak geçirelim.
  // Client bileşeni bu ID'yi kullanarak veri çekecek.
  return <ProjectDetailsClient projectId={id} />;
} 