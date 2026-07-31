import { useState } from 'react';

type Tab = 'general' | 'members' | 'projects';

export function OrganizationDetailsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  // Mock data based on images
  const mockOrg = {
    name: 'Tập đoàn xây dựng Bình Thái',
    status: 'Hoạt động',
    location: 'Thành phố Hồ Chí Minh, Việt Nam',
    initials: 'BT',
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header / Top Section ────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-card-border pb-4">
        <div className="flex items-center gap-5">
          <div className="flex h-[80px] w-[80px] shrink-0 items-center justify-center rounded-xl border border-card-border bg-card shadow-sm p-1">
             <div className="h-full w-full bg-[#F8F7F2] rounded-lg flex items-center justify-center text-2xl font-bold text-[#647C54]">
               {mockOrg.initials}
             </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-[28px] font-bold text-[#40562D]">
                {mockOrg.name}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success-light/30 px-2.5 py-1 text-[11px] font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                {mockOrg.status}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[13px] text-[#73796B]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              {mockOrg.location}
            </div>
          </div>
        </div>
        <button className="flex items-center gap-2 rounded-full border border-card-border bg-card px-5 py-2.5 text-[13px] font-medium text-text shadow-sm transition-all duration-200 hover:bg-input-bg">
          Chỉnh sửa hồ sơ
        </button>
      </div>

      {/* ── Tabs ────────────────────────────── */}
      <div className="flex items-center gap-8 border-b border-card-border">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-[14px] font-semibold transition-colors relative ${activeTab === 'general' ? 'text-[#40562D]' : 'text-text-muted hover:text-text'}`}
        >
          Thông tin chung
          {activeTab === 'general' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#40562D] rounded-t-full"></div>}
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 text-[14px] font-semibold transition-colors relative ${activeTab === 'members' ? 'text-[#40562D]' : 'text-text-muted hover:text-text'}`}
        >
          Quản lý thành viên
          {activeTab === 'members' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#40562D] rounded-t-full"></div>}
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 text-[14px] font-semibold transition-colors relative ${activeTab === 'projects' ? 'text-[#40562D]' : 'text-text-muted hover:text-text'}`}
        >
          Dự án hiện tại
          {activeTab === 'projects' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#40562D] rounded-t-full"></div>}
        </button>
      </div>

      {/* ── Tab Content ────────────────────────────── */}
      <div className="pt-2">
        {activeTab === 'general' && <GeneralTab />}
        {activeTab === 'members' && <MembersTab />}
        {activeTab === 'projects' && <ProjectsTab />}
      </div>
    </div>
  );
}

function GeneralTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Card 1 */}
        <div className="rounded-[24px] border border-card-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-[#40562D] font-bold text-[15px] mb-6">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            Thông tin pháp lý
          </div>
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">MÃ SỐ DOANH NGHIỆP</p>
              <p className="mt-1 text-[14px] text-[#2D3A28] font-medium">0101436924</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">TÊN PHÁP LÝ ĐẦY ĐỦ</p>
              <p className="mt-1 text-[14px] text-[#2D3A28] font-medium">CÔNG TY TNHH TƯ VẤN ĐẦU TƯ VÀ XÂY DỰNG BÌNH THÁI</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">TRẠNG THÁI THUẾ</p>
              <span className="mt-2 inline-flex items-center rounded-full bg-success-light/30 px-3 py-1 text-[12px] font-medium text-success">
                Đang hoạt động
              </span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-[24px] border border-card-border bg-card p-6 shadow-sm flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-[#40562D] font-bold text-[15px] mb-6 w-full justify-start">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Người đại diện pháp lý
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#E8E5DC] text-[#73796B] mb-4">
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <p className="font-display text-[16px] font-bold text-[#40562D] uppercase">PHẠM MINH HẢO</p>
          <p className="text-[14px] text-[#73796B] mt-1 mb-4">Tổng Giám đốc (CEO)</p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-light/30 px-3 py-1.5 text-[12px] font-medium text-success">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Danh tính đã xác minh
          </span>
        </div>

        {/* Card 3 */}
        <div className="rounded-[24px] border border-card-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-[#40562D] font-bold text-[15px] mb-6">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            Trụ sở & Liên hệ
          </div>
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">ĐỊA CHỈ</p>
              <p className="mt-1 text-[14px] text-[#2D3A28] font-medium">Tầng 72, Landmark 81,<br/>Vinhomes Central Park, Bình Thạnh, TP. HCM</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">ĐIỆN THOẠI</p>
              <p className="mt-1 text-[14px] text-[#2D3A28] font-medium">+84 (0) 28 3948 2736</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">EMAIL</p>
              <p className="mt-1 text-[14px] text-[#2D3A28] font-medium">contact@aurora.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="mt-8">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#A3A89C] mb-4">VỊ TRÍ ĐỊA LÝ</p>
        <div className="h-64 w-full rounded-[24px] bg-[#E8E5DC] overflow-hidden relative">
           <img src="https://static.vinwonders.com/2022/10/ban-do-thanh-pho-ho-chi-minh-1.jpg" alt="Map placeholder" className="w-full h-full object-cover opacity-60" />
           <div className="absolute inset-0 bg-[#647C54]/5"></div>
        </div>
      </div>
    </div>
  );
}

function MembersTab() {
  const members = [
    { initials: 'NV', name: 'Nguyễn Văn A', email: 'a.nguyen@aurora.com', role: 'Quản trị viên', projects: '12', status: 'Trực tuyến', statusColor: 'bg-success', activity: 'Vừa xong' },
    { initials: 'LH', name: 'Lê Hoàng Nam', email: 'nam.le@aurora.com', role: 'Kiến trúc sư chính', projects: '05', status: 'Ngoại tuyến', statusColor: 'bg-text-placeholder', activity: '2 giờ trước' },
    { initials: 'PT', name: 'Phạm Thu Hà', email: 'ha.pham@aurora.com', role: 'BIM Manage', projects: '08', status: 'Trực tuyến', statusColor: 'bg-success', activity: 'Vừa xong' },
    { initials: 'TD', name: 'Trần Đức Minh', email: 'minh.tran@aurora.com', role: 'Người xem', projects: '02', status: 'Ngoại tuyến', statusColor: 'bg-text-placeholder', activity: 'Hôm qua' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            <input
              type="text"
              placeholder="Tìm thành viên, email hoặc vai trò..."
              className="w-full appearance-none rounded-full border border-card-border bg-card pl-10 pr-4 py-2.5 text-[13px] text-text outline-none focus:border-[#647C54] shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 rounded-full border border-card-border bg-card px-4 py-2.5 text-[13px] font-medium text-text shadow-sm hover:bg-input-bg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Lọc
          </button>
        </div>
        <button className="flex items-center gap-2 rounded-full bg-[#40562D] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#2D3A28]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          Mời thành viên
        </button>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-card-border bg-card shadow-sm pb-2">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-card-border bg-[#F8F7F2]">
                <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">THÀNH VIÊN</th>
                <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">VAI TRÒ</th>
                <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">DỰ ÁN THAM GIA</th>
                <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">TRẠNG THÁI</th>
                <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">HOẠT ĐỘNG</th>
                <th className="px-6 py-5 text-center text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {members.map((m, i) => (
                <tr key={i} className="hover:bg-input-bg/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8E5DC] text-[13px] font-bold text-[#647C54]">
                        {m.initials}
                      </div>
                      <div>
                        <p className="font-bold text-[#2D3A28] text-[14px]">{m.name}</p>
                        <p className="text-[12px] text-[#A3A89C] mt-0.5">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-[#F8F7F2] px-3 py-1 text-[12px] font-medium text-[#73796B]">
                      {m.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-[#2D3A28]">{m.projects}</span> <span className="text-[#A3A89C]">dự án</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${m.statusColor}`}></span>
                      <span className="text-[#43493C] font-medium text-[13px]">{m.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#73796B]">{m.activity}</td>
                  <td className="px-6 py-4 text-center text-[#A3A89C]">
                    <button className="hover:text-text p-1"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-6 py-4 border-t border-card-border mt-2">
            <span className="text-[13px] text-text-muted">Hiển thị 1 - 10 của 142 thành viên</span>
            <div className="flex items-center gap-1">
              <button className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-input-bg"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg></button>
              <button className="flex h-7 w-7 items-center justify-center rounded-md bg-[#647C54] text-white font-medium text-[13px]">1</button>
              <button className="flex h-7 w-7 items-center justify-center rounded-md text-[#43493C] hover:bg-input-bg font-medium text-[13px]">2</button>
              <button className="flex h-7 w-7 items-center justify-center rounded-md text-[#43493C] hover:bg-input-bg font-medium text-[13px]">3</button>
              <span className="flex h-7 w-7 items-center justify-center text-text-muted text-[13px]">...</span>
              <button className="flex h-7 w-7 items-center justify-center rounded-md text-[#43493C] hover:bg-input-bg font-medium text-[13px]">15</button>
              <button className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-input-bg"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectsTab() {
  const projects = Array(6).fill({
    title: 'Khu đô thị Sky Garden',
    status: 'ĐANG HOẠT ĐỘNG',
    type: 'Đang thi công',
    role: 'Chủ đầu tư',
    date: '15/03/2024',
    img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop'
  });

  return (
    <div className="space-y-6">
       <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          <input
            type="text"
            placeholder="Tìm dự án..."
            className="w-full appearance-none rounded-full border border-card-border bg-card pl-10 pr-4 py-2.5 text-[13px] text-text outline-none focus:border-[#647C54] shadow-sm"
          />
        </div>
        <button className="flex items-center gap-2 rounded-full border border-card-border bg-card px-4 py-2.5 text-[13px] font-medium text-text shadow-sm hover:bg-input-bg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          Lọc
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p, i) => (
          <div key={i} className="rounded-[24px] border border-card-border bg-card overflow-hidden shadow-sm flex flex-col group transition-shadow hover:shadow-md">
            <div className="relative h-48 w-full overflow-hidden">
               <img src={p.img} alt="project" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
               <div className="absolute top-4 left-4 bg-[#647C54] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5">
                 <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                 {p.status}
               </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
               <div className="flex items-start justify-between gap-2 mb-4">
                 <h3 className="font-display text-[18px] font-bold text-[#2D3A28] leading-tight">
                    {i % 2 === 1 ? 'Cầu vượt sông Hàn' : i === 2 || i === 5 ? 'Tổ hợp Văn phòng Tech Hub' : p.title}
                 </h3>
                 <span className="inline-flex rounded-full bg-[#F8F7F2] px-2.5 py-1 text-[11px] font-bold text-[#647C54] shrink-0">
                    {p.type}
                 </span>
               </div>
               <div className="space-y-2 text-[13px] mb-6 flex-1">
                 <div className="flex justify-between items-center text-[#73796B]">
                   <span>Vai trò:</span>
                   <span className="font-medium text-[#2D3A28]">{i % 2 === 1 ? 'Nhà thầu' : p.role}</span>
                 </div>
                 <div className="flex justify-between items-center text-[#73796B]">
                   <span>Bắt đầu:</span>
                   <span className="font-medium text-[#2D3A28]">{i % 2 === 1 ? '10/01/2024' : i === 2 || i === 5 ? '05/05/2024' : p.date}</span>
                 </div>
               </div>
               <button className="w-full py-2.5 rounded-full border border-card-border text-[13px] font-semibold text-[#40562D] transition hover:bg-input-bg">
                 Xem chi tiết
               </button>
            </div>
          </div>
        ))}
      </div>

       <div className="flex items-center justify-between px-6 py-4 mt-2">
        <span className="text-[13px] text-text-muted">Hiển thị 1 - 10 của 142 dự án</span>
        <div className="flex items-center gap-1">
          <button className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-input-bg"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg></button>
          <button className="flex h-7 w-7 items-center justify-center rounded-md bg-[#647C54] text-white font-medium text-[13px]">1</button>
          <button className="flex h-7 w-7 items-center justify-center rounded-md text-[#43493C] hover:bg-input-bg font-medium text-[13px]">2</button>
          <button className="flex h-7 w-7 items-center justify-center rounded-md text-[#43493C] hover:bg-input-bg font-medium text-[13px]">3</button>
          <span className="flex h-7 w-7 items-center justify-center text-text-muted text-[13px]">...</span>
          <button className="flex h-7 w-7 items-center justify-center rounded-md text-[#43493C] hover:bg-input-bg font-medium text-[13px]">15</button>
          <button className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-input-bg"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg></button>
        </div>
      </div>
    </div>
  );
}
