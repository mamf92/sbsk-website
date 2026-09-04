import MemberForm from './MemberForm';
import { createMember } from '../../../supabase/queryHelpers/createMember';
import { editMember } from '../../../supabase/queryHelpers/editMember';
import { type Member } from '../../../supabase/queryHelpers/getMember';
import { Button } from '../../ui/Buttons';
import { Input } from '../../ui/Input';
import EmptyState from '../../ui/EmptyState';
import { LoadingIndicator } from '../../ui/LoadingIndicator';
import { useMemberSearch } from '../../../hooks/useMemberSearch';
import { useRevalidator } from 'react-router-dom';

interface MemberSearchSectionProps {
  members: Member[];
}

function MemberSearchList({ members }: MemberSearchSectionProps) {
  const {
    loading,
    searchTerm,
    setSearchTerm,
    selectedSortField,
    showForm,
    setShowForm,
    selectedMember,
    setSelectedMember,
    sortOptions,
    sortOrder,
    handleSortClick,
    handleMemberClick,
    handleAddMemberClick,
    filteredMembers,
    sortedMembers,
  } = useMemberSearch(members);
  const revalidator = useRevalidator();

  return (
    <div className="bg-darkblue surface-dark max-w-form md:max-w-content mx-auto mb-4 flex w-full flex-col gap-2 px-2 py-24">
      <div className="flex flex-col items-center gap-2 sm:gap-4 sm:px-2">
        <div className="flex flex-col items-start gap-2">
          <h2 className="font-heading text-h2 font-bold text-white">Medlemsliste</h2>
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
        <div className="max-w-form flex w-full items-center">
          <Input
            type="search"
            icon="search"
            aria-label="Søk etter medlem"
            placeholder="Søk etter medlem…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
        {/* Was a full-screen fixed overlay with a blur — the most intrusive of the three
            loading treatments in the app, for the least consequential wait. The list it is
            about is right here, so the indicator belongs here too. */}
        {loading && <LoadingIndicator label="Laster medlemmer…" className="px-4 py-6 text-white" />}
        {members.length === 0 && (
          <EmptyState
            variant="inline"
            headingLevel={3}
            className="text-white"
            title="Ingen medlemmer"
            body="Det finnes ingen medlemmer i databasen."
          />
        )}
        {filteredMembers.length === 0 && searchTerm !== '' && (
          <EmptyState
            variant="inline"
            headingLevel={3}
            className="text-white"
            title="Ingen treff"
            body="Ingen medlemmer matcher ditt søk."
          />
        )}
        {sortedMembers.length > 0 && selectedSortField && (
          <ul className="flex flex-col bg-white px-2 py-4">
            {sortedMembers.map((member) => (
              <li
                className="focus-visible:outline-focus-ring cursor-pointer hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2"
                key={member.id}
                role="button"
                tabIndex={0}
                aria-label={`Vis ${member.name} ${member.surname}`}
                onClick={() => handleMemberClick(member)}
                onKeyDown={(e) => {
                  // Enter/Space activation, matching native button semantics (#168) — Space
                  // also has to be prevented from scrolling the page, which the browser only
                  // does for real `<button>`/`<a>` elements on its own.
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleMemberClick(member);
                  }
                }}
              >
                <div className="flex w-full justify-between border-b border-black py-4 text-start">
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
              </li>
            ))}
          </ul>
        )}
      </div>
      {showForm && (
        // A rejection from `editMember`/`createMember` propagates up to `MemberForm`, which
        // awaits this and keeps the dialog open with the failure shown instead of closing it
        // regardless of the outcome (#169) — so nothing here closes the form or catches an error
        // itself; only a successful save does, from inside `MemberForm`.
        <MemberForm
          member={selectedMember || undefined}
          onSubmitMember={async (memberData) => {
            if (memberData.id) {
              await editMember({
                id: memberData.id,
                name: memberData.name,
                surname: memberData.surname,
                address: memberData.address,
                postcode: memberData.postcode,
                city: memberData.city,
                phone: memberData.phone,
                email: memberData.email,
                is_admin: memberData.is_admin,
              });
            } else {
              await createMember({
                name: memberData.name,
                surname: memberData.surname,
                address: memberData.address,
                postcode: memberData.postcode,
                city: memberData.city,
                phone: memberData.phone,
                email: memberData.email,
                is_admin: memberData.is_admin,
              });
            }
            revalidator.revalidate();
          }}
          onClose={() => {
            setShowForm(false);
            setSelectedMember(null);
          }}
        />
      )}
    </div>
  );
}

export default MemberSearchList;
