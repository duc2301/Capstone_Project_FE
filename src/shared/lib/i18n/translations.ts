export const translations = {
  'account.title': 'Quản lý tài khoản',
  'account.userName': 'Tên người dùng',
  'account.email': 'Email',
  'account.role': 'Vai trò',
  'account.status': 'Trạng thái',
  'account.createdAt': 'Ngày tạo',
  'account.actions': 'Hành động',
  'account.createNew': 'Tạo tài khoản mới',
  'account.editTitle': 'Chỉnh sửa tài khoản',
  'account.password': 'Mật khẩu',
  'account.update': 'Cập nhật',
  'account.delete': 'Xóa',
  'account.cancel': 'Hủy',
  'account.save': 'Lưu',
  'account.deleteConfirm': 'Bạn có chắc muốn xóa tài khoản này?',
  'common.loading': 'Đang tải...',
  'common.error': 'Có lỗi xảy ra. Vui lòng thử lại.',
  'common.noData': 'Không có dữ liệu',
  'common.notFound': 'Trang không tìm thấy',
  'common.backHome': 'Về trang chủ',
} as const;

export type TranslationKey = keyof typeof translations;

export const t = (key: TranslationKey): string => translations[key];
