import React from 'react';
import { Modal } from '@/shared/components/modal';
import { CreatePackageForm } from './CreatePackageForm';
import { contractPackageApi } from '@/entities/contractPackage';
import type { ContractPackage, CreateContractPackagePayload, UpdateContractPackagePayload } from '@/entities/contractPackage';
import { fileItemApi } from '@/entities/file-item';
import { folderApi, CdeArea } from '@/entities/folder';
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
            // Find WIP folder for the project
            const resTree = await folderApi.getTree(projectId, CdeArea.Wip);
            const wipRoot = resTree.data?.result?.find(r => r.parentFolderId === null);
            if (!wipRoot) {
              onError('Không tìm thấy thư mục gốc WIP của dự án!');
              return;
            }

            let documentFolderId = (initialData as any)?.documentFolderId;

            // If we don't have a folder yet, create one
            if (!documentFolderId) {
              const folderName = initialData?.code 
                ? `Tài liệu gói thầu ${initialData.code}` 
                : `Tài liệu gói thầu ${payload.name}`;

              try {
                const createRes = await folderApi.createSubFolder({
                  parentFolderId: wipRoot.id,
                  name: folderName
                });
                documentFolderId = createRes.data?.result?.id;
              } catch (e) {
                console.error('[PkgModal] Create subfolder failed', e);
                onError('Không thể tạo thư mục lưu trữ cho gói thầu!');
                return;
              }
            }

            // Create or update the contract package first
            if (initialData) {
              const updatePayload: UpdateContractPackagePayload = { ...payload };
              if (documentFolderId) updatePayload.documentFolderId = documentFolderId;
              await contractPackageApi.update(initialData.id, updatePayload);
            } else {
              const createPayload: CreateContractPackagePayload = { ...payload, projectId };
              if (documentFolderId) createPayload.documentFolderId = documentFolderId;
              await contractPackageApi.create(createPayload);
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
