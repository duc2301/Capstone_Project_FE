/* 1 tài liệu khớp khi tìm kiếm NGỮ NGHĨA (khớp BE FileSearchResultDTO).
 * BE embed câu hỏi rồi so vector với nội dung tài liệu đã được index (RAG),
 * nên tìm được cả khi câu hỏi không chứa đúng từ khoá trong file. */
export interface DocumentSearchResult {
  fileItemId: string;
  /* Cần để mở trang "Xem chi tiết" đúng ngữ cảnh thư mục */
  folderId: string;
  fileName: string;
  /* Đoạn nội dung khớp nhất trong file */
  snippet: string;
  /* 0..1 — càng cao càng khớp (BE tính = 1 - cosine distance) */
  similarity: number;
  /* Số đoạn trong file khớp với câu hỏi */
  matchCount: number;
}
