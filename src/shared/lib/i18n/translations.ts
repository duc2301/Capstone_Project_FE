export const translations = {
  // Account
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

  // Common
  'common.loading': 'Đang tải...',
  'common.error': 'Có lỗi xảy ra. Vui lòng thử lại.',
  'common.noData': 'Không có dữ liệu',
  'common.notFound': 'Trang không tìm thấy',
  'common.backHome': 'Về trang chủ',

  // Brand
  'brand.name': 'BIM Portal',

  // Header
  'header.nav.home': 'Trang chủ',
  'header.nav.about': 'Giới thiệu',
  'header.nav.consult': 'Tư vấn',
  'header.nav.guide': 'Hướng dẫn',
  'header.nav.contact': 'Liên hệ',
  'header.search.placeholder': 'Tìm kiếm...',
  'header.login': 'Đăng nhập',

  // Hero
  'home.hero.badge': 'Kiến tạo CDE kiến trúc',
  'home.hero.titleLead': 'Chuyển đổi số toàn diện cho',
  'home.hero.titleAccent': 'Xây dựng dân dụng',
  'home.hero.subtitle':
    'Môi trường Dữ liệu chung (CDE) tuân thủ tiêu chuẩn Việt Nam, tối ưu hóa quy trình làm việc từ thiết kế đến thi công. Quản lý thống nhất BIM mô hình, bảo mật và hiệu quả.',
  'home.hero.ctaPrimary': 'Bắt đầu ngay',
  'home.hero.ctaSecondary': 'Xem demo',
  'home.hero.tag.wip': 'WIP (Đang làm việc)',
  'home.hero.tag.shared': 'Shared (Chia sẻ)',
  'home.hero.card.published': 'Published / Phát hành',
  'home.hero.card.title': 'Tòa nhà 1F Phòng A',
  'home.hero.card.subtitle': 'Căn hộ 5 sao 6 tầng',
  'home.hero.card.status': 'Đang trống',

  // Why CDE
  'home.why.title': 'Tại sao cần BIM-CDE?',
  'home.why.subtitle':
    'Sự khác biệt giữa quản lý dự án truyền thống và quản lý với Môi trường Dữ liệu chung.',
  'home.why.without.title': 'Không có CDE',
  'home.why.without.item1': 'Dữ liệu phân tán, khó kiểm soát các bản vẽ và phiên bản.',
  'home.why.without.item2': 'Giao tiếp qua nhiều kênh (Email, Zalo) gây nhiễu thông tin.',
  'home.why.without.item3': 'Trùng dữ liệu, dễ làm sai và làm chậm tiến độ.',
  'home.why.with.title': 'Sử dụng BIM-CDE',
  'home.why.with.item1': 'Một nguồn dữ liệu duy nhất theo tiêu chuẩn ISO 19650.',
  'home.why.with.item2': 'Quy trình duyệt minh bạch, có lịch sử đầy đủ.',
  'home.why.with.item3': 'Phát hiện xung đột sớm, tiết kiệm chi phí thi công.',

  // Footer
  'footer.tagline': '© 2024-2025 BIM Portal. Toàn thể đội ngũ.',
  'footer.col.product': 'Sản phẩm',
  'footer.col.product.solution': 'Giải pháp',
  'footer.col.product.features': 'Tính năng',
  'footer.col.product.pricing': 'Giá phòng',
  'footer.col.product.docs': 'Dùng vụ',
  'footer.col.docs': 'Tài liệu',
  'footer.col.docs.guide': 'Hướng dẫn',
  'footer.col.docs.api': 'Tài liệu API',
  'footer.col.docs.standard': 'Tiêu chuẩn BIM',
  'footer.col.docs.lawVN': 'Quy chuẩn Việt Nam',
  'footer.col.support': 'Hỗ trợ',
  'footer.col.support.contact': 'Liên hệ',
  'footer.col.support.tech': 'Hỗ trợ kỹ thuật',
  'footer.col.support.training': 'Tập huấn',
  'footer.col.support.community': 'Mạng xã hội',
} as const;

export type TranslationKey = keyof typeof translations;

export const t = (key: TranslationKey): string => translations[key];
