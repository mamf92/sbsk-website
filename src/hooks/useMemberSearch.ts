import { useEffect, useMemo, useState } from 'react';
import { type Member } from '../supabase/queryHelpers/getMember';

type SortField = 'name' | 'surname' | 'address' | 'city';

const sortOptions: { key: SortField; label: string; size: string }[] = [
  { key: 'name', label: 'Navn', size: 'max-xs:w-[17%] w-[19%]' },
  { key: 'surname', label: 'Etternavn', size: 'max-xs:w-[24%] w-[21%]' },
  { key: 'address', label: 'Adresse', size: 'w-[28%]' },
  { key: 'city', label: 'Poststed', size: 'w-[22%]' },
];

export function useMemberSearch(members: Member[]) {
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSortField, setSelectedSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showForm, setShowForm] = useState(false);
  const [showMemberDetails, setShowMemberDetails] = useState(false);

  useEffect(() => {
    setLoading(true);
    setLoading(false);
  }, [members]);

  const filteredMembers = useMemo(() => {
    const term = searchTerm.toLowerCase();

    const matches = (member: Member) =>
      (member.name?.toLowerCase().includes(term) ?? false) ||
      (member.surname?.toLowerCase().includes(term) ?? false) ||
      (member.address?.toLowerCase().includes(term) ?? false) ||
      (member.city?.toLowerCase().includes(term) ?? false);

    return members.filter(matches);
  }, [members, searchTerm]);

  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      const fieldA = a[selectedSortField] ?? '';
      const fieldB = b[selectedSortField] ?? '';

      return sortOrder === 'asc'
        ? fieldA.localeCompare(fieldB, ['no', 'sv', 'da'], { sensitivity: 'base' })
        : fieldB.localeCompare(fieldA, ['no', 'sv', 'da'], { sensitivity: 'base' });
    });
  }, [filteredMembers, selectedSortField, sortOrder]);

  const handleSortClick = (field: SortField) => {
    if (selectedSortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortOrder('asc');
    }
    setSelectedSortField(field);
  };

  const handleMemberClick = (member: Member) => {
    setSelectedMember(member);
    setShowForm(true);
  };

  const handleAddMemberClick = () => {
    setSelectedMember(null);
    setShowMemberDetails(false);
    setShowForm(true);
  };

  return {
    loading,
    sortOptions,
    searchTerm,
    setSearchTerm,
    selectedSortField,
    sortOrder,
    selectedMember,
    showForm,
    showMemberDetails,
    setShowForm,
    setShowMemberDetails,
    setSelectedMember,
    filteredMembers,
    sortedMembers,
    handleSortClick,
    handleMemberClick,
    handleAddMemberClick,
  };
}
