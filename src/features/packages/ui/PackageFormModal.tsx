import { Modal } from '@/shared/components/modal';
import { CreatePackageForm } from './CreatePackageForm';
import { contractPackageApi } from '@/entities/contractPackage';
import type { ContractPackage, CreateContractPackagePayload, UpdateContractPackagePayload } from '@/entities/contractPackage';
import { fileItemApi } from '@/entities/file-item';
import { FileType } from '@/entities/file-item/model/fileItem.types';

/** Detect BE FileType from file extension for proper view/download support */
function detectFileType(fileName: string): number {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return FileType.Pdf;
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) return FileType.Image;
  if (ext === 'ifc') return FileType.Ifc;
  if (['dwg', 'dxf', 'rvt', 'nwc', 'nwd', 'dgn'].includes(ext)) return FileType.Cad;
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'txt'].includes(ext)) return FileType.Office;
  return FileType.Other;
}
import type { Account } from '@/entities/account';

export interface PackageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  initialData?: ContractPackage;
  accounts: Account[];
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function PackageFormModal({
  isOpen,
  onClose,
  projectId,
  initialData,
  accounts,
  onSuccess,
  onError
}: PackageFormModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      title={initialData ? "Chỉnh sửa gói thầu" : "Thêm gói thầu mới"}
      onClose={onClose}
      maxWidth="max-w-4xl"
    >
      <CreatePackageForm
        initialData={initialData}
        accounts={accounts}
        onCancel={onClose}
        onSubmit={async (payload, files) => {
          try {
            let documentFolderId = (initialData as any)?.documentFolderId;

            // Create or update the contract package first
            if (initialData) {
              const updatePayload: UpdateContractPackagePayload = { ...payload };
              const updateRes = await contractPackageApi.update(initialData.id, updatePayload);
              documentFolderId = updateRes.data?.result?.documentFolderId || documentFolderId;
            } else {
              const createPayload: CreateContractPackagePayload = { ...payload, projectId };
              const createRes = await contractPackageApi.create(createPayload);
              documentFolderId = createRes.data?.result?.documentFolderId;
            }

            // Upload any new files to the folder
            if (documentFolderId && files && files.length > 0) {
              const uploadPromises = files.map(file => {
                const formData = new FormData();
                formData.append('FolderId', documentFolderId);
                formData.append('FileType', detectFileType(file.name).toString());
                const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
                formData.append('Name', nameWithoutExt);
                formData.append('file', file);
                return fileItemApi.upload(formData);
              });

              await Promise.all(uploadPromises);
            }

            onSuccess(initialData ? 'Cập nhật gói thầu thành công' : 'Tạo gói thầu thành công');
          } catch (e: any) {
            console.error('Package submit error:', e);
            onError(e.message || (initialData ? 'Lỗi khi cập nhật' : 'Lỗi khi tạo gói thầu'));
          }
        }}
      />
    </Modal>
  );
}
