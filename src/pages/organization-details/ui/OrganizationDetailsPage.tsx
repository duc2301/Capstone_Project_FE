import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { organizationApi } from '@/entities/organization/api/organizationApi';
import { accountApi } from '@/entities/account/api/accountApi';
import type { Organization } from '@/entities/organization';
import type { Account } from '@/entities/account';

import { useOrganizationTypes } from '@/features/organizations/model/useOrganizationTypes';
import { useOrganizations } from '@/features/organizations/model/useOrganizations';
import { UpdateOrganizationForm } from '@/features/organizations/ui/UpdateOrganizationForm';
import { Modal } from '@/shared/components/modal/Modal';

type Tab = 'general' | 'members' | 'projects';

export function OrganizationDetailsPage() {
  const { orgId: id } = useParams<{ orgId: string }>();
  const { orgTypes } = useOrganizationTypes();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);
  const [participatingProjects, setParticipatingProjects] = useState<any[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [addingMember, setAddingMember] = useState(false);

  const { updateOrganization, organizations } = useOrganizations();

  const fetchMembersAndAvailable = async () => {
    try {
      const accRes = await accountApi.getAll();
      if (accRes.data.isSuccess && accRes.data.result) {
        const allAccs = accRes.data.result;
        setMembers(allAccs.filter((acc: Account) => acc.organizationId === id));
        setAvailableAccounts(allAccs.filter((acc: Account) => !acc.organizationId || acc.organizationId !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchParticipatingProjects = async () => {
    try {
      const projRes = await organizationApi.getProjects(id!);
      if (projRes.data.isSuccess && projRes.data.result) {
        setParticipatingProjects(projRes.data.result);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const orgRes = await organizationApi.getById(id);
        if (orgRes.data.isSuccess && orgRes.data.result) {
          setOrganization(orgRes.data.result);
        }
        await Promise.all([
          fetchMembersAndAvailable(),
          fetchParticipatingProjects()
        ]);
      } catch (error) {
        console.error('Failed to fetch organization details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleUpdateOrganization = async (orgId: string, payload: any, selectedAccountIds?: string[], initialAccountIds?: string[]) => {
    try {
      await updateOrganization(orgId, payload);
      
      if (selectedAccountIds && initialAccountIds) {
        const added = selectedAccountIds.filter(aid => !initialAccountIds.includes(aid));
        const removed = initialAccountIds.filter(aid => !selectedAccountIds.includes(aid));
        
        const promises = [];
        for (const accountId of added) {
          promises.push(accountApi.update(accountId, { organizationId: orgId }));
        }
        for (const accountId of removed) {
          promises.push(accountApi.update(accountId, { clearOrganization: true }));
        }
        
        if (promises.length > 0) {
          await Promise.all(promises);
        }
      }
      
      // Re-fetch organization and members
      const orgRes = await organizationApi.getById(id!);
      if (orgRes.data.isSuccess && orgRes.data.result) {
        setOrganization(orgRes.data.result);
      }
      await fetchMembersAndAvailable();
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Lỗi khi cập nhật tổ chức:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-[14px] font-medium text-text-muted">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <p className="text-[14px] font-medium text-text-muted">Không tìm thấy doanh nghiệp</p>
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return 'A';
    const words = name.trim().split(/\s+/);
    return (words.length > 1 
      ? words[0][0] + words[1][0] 
      : words[0].substring(0, 2)).toUpperCase();
  };

  const handleAddMembers = async () => {
    if (!id || selectedAccountIds.length === 0) return;
    setAddingMember(true);
    try {
      await Promise.all(
        selectedAccountIds.map((accId) => accountApi.update(accId, { organizationId: id }))
      );
      await fetchMembersAndAvailable();
      setIsAddMemberModalOpen(false);
      setSelectedAccountIds([]);
    } catch (err) {
      console.error('Lỗi khi thêm thành viên:', err);
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (accountId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi doanh nghiệp?')) return;
    try {
      await accountApi.update(accountId, { clearOrganization: true });
      await fetchMembersAndAvailable();
    } catch (err) {
      console.error('Lỗi khi xóa thành viên:', err);
      alert('Không thể xóa thành viên. Vui lòng thử lại.');
    }
  };

  const orgTypeName = orgTypes.find(t => t.id === organization.organizationTypeId)?.name || 'Khác';
  const statusText = organization.taxCode || organization.isJointVenture ? 'Đang hoạt động' : 'Chờ duyệt';
  const orgProjects = participatingProjects;

  return (
    <div className="space-y-6">
      {/* ── Page Header / Top Section ────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-card-border pb-4">
        <div className="flex items-center gap-5">
          <div className="flex h-[80px] w-[80px] shrink-0 items-center justify-center rounded-xl border border-card-border bg-card shadow-sm p-1">
            <div className="h-full w-full bg-[#F8F7F2] rounded-lg flex items-center justify-center text-2xl font-bold text-[#647C54]">
              {getInitials(organization.displayName || organization.legalName)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-[28px] font-bold text-[#40562D]">
                {organization.legalName}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success-light/30 px-2.5 py-1 text-[11px] font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                Hoạt động
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[13px] text-[#73796B]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              {organization.address || 'Chưa cập nhật địa chỉ'}
            </div>
          </div>
        </div>
        <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2 rounded-full border border-card-border bg-card px-5 py-2.5 text-[13px] font-medium text-text shadow-sm transition-all duration-200 hover:bg-input-bg">
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
          Quản lý thành viên ({members.length})
          {activeTab === 'members' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#40562D] rounded-t-full"></div>}
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 text-[14px] font-semibold transition-colors relative ${activeTab === 'projects' ? 'text-[#40562D]' : 'text-text-muted hover:text-text'}`}
        >
          Dự án hiện tại ({orgProjects.length})
          {activeTab === 'projects' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#40562D] rounded-t-full"></div>}
        </button>
      </div>

      {/* ── Tab Content ────────────────────────────── */}
      <div className="pt-2">
        {activeTab === 'general' && <GeneralTab organization={organization} orgTypeName={orgTypeName} statusText={statusText} />}
        {activeTab === 'members' && <MembersTab members={members} onOpenAddMember={() => setIsAddMemberModalOpen(true)} onRemoveMember={handleRemoveMember} />}
        {activeTab === 'projects' && <ProjectsTab projects={orgProjects} organization={organization} members={members} />}
      </div>

      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[24px] bg-card p-6 shadow-modal">
            <h2 className="mb-4 text-lg font-bold text-text">Mời thành viên</h2>
            <div className="mb-6 max-h-60 overflow-y-auto rounded-xl border border-card-border p-2">
              {availableAccounts.length === 0 ? (
                <p className="p-4 text-center text-[13px] text-text-muted">Không có người dùng khả dụng</p>
              ) : (
                availableAccounts.map(acc => (
                  <label key={acc.id} className="flex cursor-pointer items-center gap-3 p-3 hover:bg-input-bg rounded-lg transition">
                    <input
                      type="checkbox"
                      checked={selectedAccountIds.includes(acc.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedAccountIds([...selectedAccountIds, acc.id]);
                        else setSelectedAccountIds(selectedAccountIds.filter(id => id !== acc.id));
                      }}
                      className="h-4 w-4 rounded border-card-border text-[#40562D] focus:ring-[#40562D]"
                    />
                    <div className="flex-1">
                      <p className="text-[14px] font-medium text-text">{acc.userName}</p>
                      <p className="text-[12px] text-text-muted">{acc.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsAddMemberModalOpen(false)}
                className="rounded-full px-5 py-2.5 text-[13px] font-medium text-text transition hover:bg-input-bg"
              >
                Hủy
              </button>
              <button
                onClick={handleAddMembers}
                disabled={addingMember || selectedAccountIds.length === 0}
                className="flex items-center gap-2 rounded-full bg-[#40562D] px-6 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#2D3A28] disabled:opacity-50"
              >
                {addingMember ? 'Đang lưu...' : 'Thêm thành viên'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <Modal title="Chỉnh sửa hồ sơ" onClose={() => setIsEditModalOpen(false)}>
          <div className="p-2">
            <UpdateOrganizationForm
              organization={organization}
              organizations={organizations}
              orgTypes={orgTypes}
              onSubmit={handleUpdateOrganization}
              onCancel={() => setIsEditModalOpen(false)}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

function GeneralTab({ organization, orgTypeName, statusText }: { organization: Organization, orgTypeName: string, statusText: string }) {
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
              <p className="mt-1 text-[14px] text-[#2D3A28] font-medium">{organization.taxCode || '---'}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">TÊN PHÁP LÝ ĐẦY ĐỦ</p>
              <p className="mt-1 text-[14px] text-[#2D3A28] font-medium">{organization.legalName}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">LOẠI HÌNH DOANH NGHIỆP</p>
              <p className="mt-1 text-[14px] text-[#2D3A28] font-medium">{orgTypeName}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">TRẠNG THÁI</p>
              <span className="mt-2 inline-flex items-center rounded-full bg-success-light/30 px-3 py-1 text-[12px] font-medium text-success">
                {statusText}
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
          <p className="font-display text-[16px] font-bold text-[#40562D] uppercase">CHƯA CẬP NHẬT</p>
          <p className="text-[14px] text-[#73796B] mt-1 mb-4">Đại diện pháp luật</p>
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
              <p className="mt-1 text-[14px] text-[#2D3A28] font-medium">{organization.address || '---'}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">ĐIỆN THOẠI</p>
              <p className="mt-1 text-[14px] text-[#2D3A28] font-medium">{organization.phone || '---'}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">EMAIL</p>
              <p className="mt-1 text-[14px] text-[#2D3A28] font-medium">{organization.email || '---'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="mt-8">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#A3A89C] mb-4">VỊ TRÍ ĐỊA LÝ</p>
        <div className="h-64 w-full rounded-[24px] bg-card overflow-hidden border border-card-border shadow-sm">
           <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(organization.address || 'Hà Nội, Việt Nam')}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
              allowFullScreen
           ></iframe>
        </div>
      </div>
    </div>
  );
}

function MembersTab({ members, onOpenAddMember, onRemoveMember }: { members: Account[], onOpenAddMember: () => void, onRemoveMember: (id: string) => void }) {
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'Active': return 'bg-success';
      case 'Inactive': return 'bg-text-muted';
      case 'Suspended': return 'bg-danger';
      default: return 'bg-text-muted';
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filtered = useMemo(() => {
    return members.filter(m => 
      (m.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (m.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [members, searchQuery]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input 
              type="text" 
              placeholder="Tìm kiếm thành viên..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-64 rounded-full border border-card-border bg-card pl-10 pr-4 text-[13px] text-text outline-none transition-colors focus:border-[#647C54]" 
            />
          </div>
          <button className="flex h-10 items-center gap-2 rounded-full border border-card-border bg-card px-4 text-[13px] font-medium text-text-muted transition-colors hover:bg-input-bg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Lọc
          </button>
        </div>
        <button onClick={onOpenAddMember} className="flex items-center gap-2 rounded-full bg-[#40562D] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#2D3A28]">
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
                <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">DỰ ÁN THAM GIA</th>
                <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">TRẠNG THÁI</th>
                <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">HOẠT ĐỘNG</th>
                <th className="px-6 py-5 text-center text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                    {searchQuery ? 'Không tìm thấy thành viên phù hợp.' : 'Chưa có thành viên nào trong doanh nghiệp này.'}
                  </td>
                </tr>
              ) : (
                paginatedList.map((m) => (
                  <tr key={m.id} className="hover:bg-input-bg/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8E5DC] text-[13px] font-bold text-[#647C54] overflow-hidden">
                          {m.avatarUrl ? (
                            <img src={m.avatarUrl} alt={m.userName} className="h-full w-full object-cover" />
                          ) : (
                            m.userName.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-[#2D3A28] text-[14px]">{m.userName}</p>
                          <p className="text-[12px] text-[#A3A89C] mt-0.5">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-[#2D3A28]">{m.managedProjects?.length || 0}</span> <span className="text-[#A3A89C]">dự án</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${getStatusColor(m.status)}`}></span>
                        <span className="text-[#43493C] font-medium text-[13px]">
                          {m.status === 'Active' ? 'Trực tuyến' : m.status || 'Ngoại tuyến'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#73796B]">
                      {m.updatedAt ? new Date(m.updatedAt).toLocaleDateString('vi-VN') : 'Mới đây'}
                    </td>
                    <td className="px-6 py-4 text-center text-[#A3A89C]">
                      <button onClick={() => onRemoveMember(m.id)} className="hover:text-danger p-1" title="Xóa khỏi doanh nghiệp">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-card-border mt-2">
              <span className="text-[13px] text-text-muted">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} của {filtered.length} thành viên
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-input-bg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const page = idx + 1;
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <button 
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`flex h-7 w-7 items-center justify-center rounded-md font-medium text-[13px] transition ${currentPage === page ? 'bg-[#647C54] text-white shadow-sm' : 'text-[#43493C] hover:bg-input-bg'}`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="flex h-7 w-7 items-center justify-center text-text-muted text-[13px]">...</span>;
                  }
                  return null;
                })}

                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-input-bg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectsTab({ projects, organization, members }: { projects: any[], organization: any, members: any[] }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filtered = useMemo(() => {
    return projects.filter(p => 
      (p.projectName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.projectCode || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  return (
    <div className="space-y-6">
       <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          <input
            type="text"
            placeholder="Tìm dự án..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full appearance-none rounded-full border border-card-border bg-card pl-10 pr-4 py-2.5 text-[13px] text-text outline-none focus:border-[#647C54] shadow-sm"
          />
        </div>
        <button className="flex items-center gap-2 rounded-full border border-card-border bg-card px-4 py-2.5 text-[13px] font-medium text-text shadow-sm hover:bg-input-bg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          Lọc
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
           <div className="col-span-full py-8 text-center text-text-muted">
             {searchQuery ? 'Không tìm thấy dự án phù hợp.' : 'Chưa có dự án nào'}
           </div>
        ) : (
          paginatedList.map((p, i) => {
            let roleText = 'Đối tác / Thành viên';
            if (p.ownerOrganizationId === organization.id) {
              roleText = 'Chủ đầu tư';
            } else if (members.some(m => m.id === p.managerAccountId)) {
              roleText = 'Quản lý dự án';
            }

            return (
              <div key={i} className="group flex flex-col overflow-hidden rounded-[20px] border border-card-border bg-card shadow-sm transition-all hover:shadow-md">
                {/* Image & Status Badge */}
                <div className="relative h-40 w-full bg-[#E5E9E0] overflow-hidden">
                  {p.projectImageUrl ? (
                    <img src={p.projectImageUrl} alt={p.projectName} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#E5E9E0] to-[#C9D1C1]"></div>
                  )}
                  <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-[#40562D]/90 backdrop-blur-md px-3 py-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${p.status === 1 ? 'bg-[#FFB020]' : 'bg-[#10B981]'}`}></span>
                    <span className="text-[10px] font-bold tracking-wider text-white uppercase">
                      {p.status === 1 ? 'Đang hoạt động' : 'Đã hoàn thành'}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <h4 className="font-bold text-[#2D3A28] text-[16px] leading-tight line-clamp-2 font-serif">{p.projectName}</h4>
                    {p.projectCode && (
                      <span className="shrink-0 rounded-full bg-[#F2F4F0] px-3 py-1 text-[11px] font-medium text-[#40562D]">
                        {p.projectCode}
                      </span>
                    )}
                  </div>

                  <div className="mb-6 space-y-2.5 text-[13px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#A3A89C]">Vai trò:</span>
                      <span className="font-medium text-[#2D3A28]">{roleText}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="mt-auto w-full rounded-[14px] border border-[#E5E9E0] bg-transparent py-2.5 text-[13px] font-medium text-[#2D3A28] transition hover:bg-[#F2F4F0]"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-card-border mt-2">
          <span className="text-[13px] text-text-muted">
            Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} của {filtered.length} dự án
          </span>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-input-bg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            
            {Array.from({ length: totalPages }).map((_, idx) => {
              const page = idx + 1;
              if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                return (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-7 w-7 items-center justify-center rounded-md font-medium text-[13px] transition ${currentPage === page ? 'bg-[#647C54] text-white shadow-sm' : 'text-[#43493C] hover:bg-input-bg'}`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="flex h-7 w-7 items-center justify-center text-text-muted text-[13px]">...</span>;
              }
              return null;
            })}

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-input-bg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
