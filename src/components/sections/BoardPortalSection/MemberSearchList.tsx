// import MemberForm from './MemberForm';
// import MemberDetails from './MemberDetails';
import Search from '../../../assets/icons/symbols/search.svg?react';
import { type Profile } from '../../../supabase/queryHelpers/getProfil';
import { Button } from '../../ui/Buttons';
import { useMemberSearch } from '../../../hooks/useMemberSearch';

interface MemberSearchSectionProps {
  members: Profile[];
}

function MemberSearchList({ members }: MemberSearchSectionProps) {
  const {
    loading,
    searchTerm,
    setSearchTerm,
    selectedSortField,
    selectedMember,
    setSelectedMember,
    sortOptions,
    sortOrder,
    showForm,
    showMemberDetails,
    setShowForm,
    setShowMemberDetails,
    handleSortClick,
    handleMemberClick,
    handleEditMemberClick,
    handleAddMemberClick,
    filteredMembers,
    sortedMembers,
  } = useMemberSearch(members);

  return (
    <div className="bg-darkblue mx-auto mb-4 flex w-full max-w-150 flex-col gap-2 px-2 py-24 md:max-w-200">
      <div className="flex flex-col items-center gap-2 sm:gap-4 sm:px-2">
        <div className="flex flex-col items-start gap-2">
          <h2 className="font-heading text-2xl font-bold text-white">Medlemsliste</h2>
          <p className="font-body text-white">
            Her ser du oversikt over alle medlemmene i klubben. Klikk på et medlem for å se mer info
            eller redigere innholdet.
          </p>
        </div>
        <div className="flex w-full items-center justify-start md:justify-end">
          <Button
            variant="primary"
            size="sm"
            icon="add"
            className=""
            onClick={handleAddMemberClick}
          >
            Legg til medlem
          </Button>
        </div>
        <div className="relative flex w-full max-w-150 items-center">
          <input
            type="text"
            placeholder="Søk etter medlem..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="focus:ring-orange border-darkblue dark:border-orange placeholder:text-placeholder text-darkblue placeholder:font-body w-full border bg-white px-3 py-2 focus:ring-2 focus:outline-none md:px-4 md:py-3"
          />
          <Search className="absolute right-6 h-5 w-5 text-gray-500" />
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:px-2">
        <div>
          <div className="flex w-full items-center gap-2 sm:gap-2">
            {sortOptions.map((option) => (
              <Button
                key={option.key}
                onClick={() => handleSortClick(option.key)}
                className={`${option.size}`}
                variant={`${selectedSortField === option.key ? 'secondary' : 'primary'}`}
                size="xs"
                icon={
                  selectedSortField === option.key ? (sortOrder === 'asc' ? 'asc' : 'desc') : 'none'
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        {loading && (
          <div className="bg-mutedbackground/50 fixed top-0 left-0 z-40 h-full w-full backdrop-blur-sm dark:bg-black/50">
            <p className="fixed top-1/3 left-1/2 z-50 -translate-x-1/2 -translate-y-1/3 dark:text-white">
              Laster medlemmer...
            </p>
          </div>
        )}
        {members.length === 0 && (
          <p className="text-copy">Det finnes ingen medlemmer i databasen.</p>
        )}
        {filteredMembers.length === 0 && searchTerm !== '' && (
          <p className="text-copy">Ingen medlemmer matcher ditt søk.</p>
        )}
        {sortedMembers.length > 0 && selectedSortField && (
          <div className="flex flex-col bg-white px-2 py-4">
            {sortedMembers.map((member) => (
              <div
                className="hover:bg-background hover:cursor-pointer"
                key={member.id}
                onClick={() => handleMemberClick(member)}
              >
                <div className="flex w-full justify-between border-y border-black py-4 text-start">
                  <div className="w-[20%]">
                    <p className="text-sm hyphens-auto capitalize sm:text-base" lang="no">
                      {member.name}
                    </p>
                  </div>
                  <div className="w-[23%]">
                    <p className="text-sm hyphens-auto capitalize sm:text-base" lang="no">
                      {member.surname}
                    </p>
                  </div>
                  <div className="w-[30%]">
                    <p className="text-sm hyphens-auto capitalize sm:text-base" lang="no">
                      {member.address}
                    </p>
                  </div>
                  <div className="w-[27%]">
                    <p className="text-sm hyphens-auto capitalize sm:text-base" lang="no">
                      {member.city}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* {showForm && (
        <MemberForm
          member={selectedMember || undefined}
          onSubmitMember={() => {
            setShowForm(false);
            setSelectedMember(null);
          }}
          onClose={() => {
            setShowForm(false);
            setSelectedMember(null);
          }}
        />
      )}
      {showMemberDetails && selectedMember && (
        <MemberDetails
          member={selectedMember}
          onDeleteMember={() => {
            setShowMemberDetails(false);
            setSelectedMember(null);
          }}
          onEditMemberClick={handleEditMemberClick}
          onClose={() => {
            setShowMemberDetails(false);
            setSelectedMember(null);
          }}
        />
      )} */}
    </div>
  );
}

export default MemberSearchList;
