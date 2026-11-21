import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Check } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { useAuth } from '@/context/AuthContext';
import { checkoutService } from '@/services';
import type { ShippingAddressInput } from '@/services/api/checkoutService';

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, endSession, updateProfile } = useAuth();

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const [profileName, setProfileName] = React.useState(user?.name || 'Aarav Mehta');
  const [profilePhone, setProfilePhone] = React.useState(user?.phone || '+91 98201 44512');
  const [profileSuccessMessage, setProfileSuccessMessage] = React.useState<string | null>(null);

  // Saved addresses state
  const [addresses, setAddresses] = React.useState<ShippingAddressInput[]>([]);
  const [, setLoadingAddresses] = React.useState(true);
  const [isAddressFormOpen, setIsAddressFormOpen] = React.useState(false);
  const [addressFormData, setAddressFormData] = React.useState<ShippingAddressInput>({
    fullName: user?.name || 'Aarav Mehta',
    phone: user?.phone || '+91 98201 44512',
    line1: '',
    line2: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    country: 'India',
    label: '',
    isDefault: false,
  });
  const [addressFormErrors, setAddressFormErrors] = React.useState<Record<string, string>>({});

  // Sync profile fields when user updates
  React.useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfilePhone(user.phone || '+91 98201 44512');
    }
  }, [user]);

  // Load saved addresses from shared checkoutService
  const loadAddresses = React.useCallback(async () => {
    if (checkoutService.getSavedAddresses) {
      try {
        setLoadingAddresses(true);
        const list = await checkoutService.getSavedAddresses();
        setAddresses(list);
      } catch (err) {
        console.warn('Failed to load saved addresses in account:', err);
      } finally {
        setLoadingAddresses(false);
      }
    }
  }, []);

  React.useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleSignOut = async () => {
    await endSession();
    navigate('/');
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    await updateProfile({
      name: profileName.trim(),
      phone: profilePhone.trim(),
    });
    setIsEditingProfile(false);
    setProfileSuccessMessage('Profile details updated for this demo session.');
    setTimeout(() => setProfileSuccessMessage(null), 4000);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = checkoutService.validateShippingAddress(addressFormData);
    if (!validation.isValid) {
      setAddressFormErrors(validation.errors);
      return;
    }

    try {
      if (checkoutService.saveAddress) {
        const updated = await checkoutService.saveAddress(addressFormData);
        setAddresses(updated);
      }
      setIsAddressFormOpen(false);
      setAddressFormErrors({});
    } catch (err) {
      console.error('Failed to save address:', err);
    }
  };

  const handleDeleteAddress = async (line1: string, pincode: string) => {
    if (checkoutService.deleteAddress) {
      const updated = await checkoutService.deleteAddress(line1, pincode);
      setAddresses(updated);
    }
  };

  const handleSetDefaultAddress = async (line1: string, pincode: string) => {
    if (checkoutService.setDefaultAddress) {
      const updated = await checkoutService.setDefaultAddress(line1, pincode);
      setAddresses(updated);
    }
  };

  return (
    <div className="bg-pure-white text-on-pure-white min-h-[calc(100vh-72px)]">
      <Container className="py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-label text-sm text-muted-gray mb-6">
          <Link to="/" className="hover:text-on-pure-white transition-colors">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-on-pure-white font-semibold">My Account</span>
        </nav>

        {/* Page Header */}
        <div className="pb-6 border-b border-outline-subtle mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-pure-white">
              My account.
            </h1>
            <p className="font-body text-base text-muted-gray mt-1">
              {isAuthenticated
                ? `Logged in as demo customer: ${user?.name || 'Aarav Mehta'}`
                : 'Demo guest profile · Session not linked to a permanent backend account'}
            </p>
          </div>
        </div>

        {/* Account Grid: Sidebar + Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left-Side Navigation */}
          <aside className="lg:col-span-3">
            <nav
              aria-label="Account sections"
              className="flex flex-col border border-outline-subtle rounded-sm divide-y divide-outline-subtle bg-pure-white overflow-hidden"
            >
              <Link
                to="/account"
                className="px-5 py-3.5 font-label text-sm font-semibold text-on-pure-white bg-light-gray border-l-2 border-primary-orange"
              >
                Profile &amp; Details
              </Link>
              <Link
                to="/orders"
                className="px-5 py-3.5 font-label text-sm text-muted-gray hover:text-on-pure-white hover:bg-light-gray transition-colors"
              >
                My Orders
              </Link>
              <a
                href="#saved-addresses"
                className="px-5 py-3.5 font-label text-sm text-muted-gray hover:text-on-pure-white hover:bg-light-gray transition-colors"
              >
                Saved Addresses
              </a>
              <Link
                to="/wishlist"
                className="px-5 py-3.5 font-label text-sm text-muted-gray hover:text-on-pure-white hover:bg-light-gray transition-colors"
              >
                Wishlist
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-left px-5 py-3.5 font-label text-sm font-semibold text-accent-orange-text hover:bg-light-gray transition-colors"
              >
                Sign Out
              </button>
            </nav>
          </aside>

          {/* Main Account Details Column */}
          <div className="lg:col-span-9 flex flex-col gap-10">
            {/* 1. Customer Profile Summary */}
            <section aria-labelledby="profile-heading" className="flex flex-col gap-5">
              <div className="flex items-center justify-between gap-4">
                <h2 id="profile-heading" className="font-headline text-2xl font-bold text-on-pure-white">
                  Profile details
                </h2>
                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="px-4 py-2 rounded-sm border border-outline-subtle bg-pure-white font-label text-sm font-semibold text-on-pure-white hover:border-deep-black transition-colors"
                  >
                    Edit profile
                  </button>
                )}
              </div>

              {profileSuccessMessage && (
                <div className="p-3.5 rounded-sm bg-primary-orange-tint border border-primary-orange text-xs text-on-pure-white font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-accent-orange-text" />
                  <span>{profileSuccessMessage}</span>
                </div>
              )}

              {/* Read-Only Profile View */}
              {!isEditingProfile ? (
                <div className="p-6 rounded-sm border border-outline-subtle bg-light-gray grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="font-label text-xs font-semibold text-muted-gray uppercase tracking-wider">
                      Full name
                    </span>
                    <span className="font-headline text-base font-bold text-on-pure-white">
                      {user?.name || 'Aarav Mehta'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-label text-xs font-semibold text-muted-gray uppercase tracking-wider">
                      Email address
                    </span>
                    <span className="font-headline text-base font-bold text-on-pure-white">
                      {user?.email || 'aarav@mehta.in'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-label text-xs font-semibold text-muted-gray uppercase tracking-wider">
                      Phone number
                    </span>
                    <span className="font-headline text-base font-bold text-on-pure-white tabular-nums">
                      {user?.phone || '+91 98201 44512'}
                    </span>
                  </div>
                </div>
              ) : (
                /* Inline Edit Profile Form */
                <form
                  onSubmit={handleProfileSave}
                  className="p-6 rounded-sm border border-outline-subtle bg-pure-white flex flex-col gap-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="edit-name" className="font-label text-sm font-semibold text-on-pure-white">
                        Full name
                      </label>
                      <input
                        id="edit-name"
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-sm border border-outline-subtle bg-pure-white font-body text-sm text-on-pure-white focus:outline-none focus:border-deep-black"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="edit-phone" className="font-label text-sm font-semibold text-on-pure-white">
                        Phone number
                      </label>
                      <input
                        id="edit-phone"
                        type="tel"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-sm border border-outline-subtle bg-pure-white font-body text-sm text-on-pure-white tabular-nums focus:outline-none focus:border-deep-black"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2 rounded-sm border border-outline-subtle font-label text-sm font-semibold text-on-pure-white hover:border-deep-black"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-sm bg-deep-black text-on-deep-black font-label text-sm font-semibold hover:bg-surface-dark-elevated"
                    >
                      Save changes
                    </button>
                  </div>
                </form>
              )}
            </section>

            {/* 2. Saved Addresses Section */}
            <section id="saved-addresses" aria-labelledby="addresses-heading" className="pt-8 border-t border-outline-subtle flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 id="addresses-heading" className="font-headline text-2xl font-bold text-on-pure-white">
                    Saved addresses
                  </h2>
                  <p className="font-body text-sm text-muted-gray mt-0.5">
                    Addresses are synchronized with your checkout options.
                  </p>
                </div>
                {!isAddressFormOpen && (
                  <button
                    type="button"
                    onClick={() => {
                      setAddressFormData({
                        fullName: user?.name || 'Aarav Mehta',
                        phone: user?.phone || '+91 98201 44512',
                        line1: '',
                        line2: '',
                        city: 'Mumbai',
                        state: 'Maharashtra',
                        pincode: '400050',
                        country: 'India',
                        label: '',
                        isDefault: addresses.length === 0,
                      });
                      setIsAddressFormOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm border border-outline-subtle bg-pure-white text-on-pure-white font-label text-sm font-semibold hover:border-deep-black transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add new address</span>
                  </button>
                )}
              </div>

              {/* Add New Address Form Modal/Drawer */}
              {isAddressFormOpen && (
                <form
                  onSubmit={handleSaveAddress}
                  className="p-6 rounded-sm border border-outline-subtle bg-pure-white flex flex-col gap-4"
                  noValidate
                >
                  <div className="flex items-center justify-between pb-3 border-b border-outline-subtle">
                    <h3 className="font-headline text-lg font-bold text-on-pure-white">Add new address</h3>
                    <button
                      type="button"
                      onClick={() => setIsAddressFormOpen(false)}
                      className="font-label text-sm text-muted-gray hover:text-on-pure-white"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label text-sm font-semibold text-on-pure-white">Recipient full name *</label>
                      <input
                        type="text"
                        value={addressFormData.fullName}
                        onChange={(e) => setAddressFormData({ ...addressFormData, fullName: e.target.value })}
                        className="px-3.5 py-2.5 rounded-sm border border-outline-subtle bg-pure-white text-sm"
                      />
                      {addressFormErrors.fullName && (
                        <span className="text-xs text-red-600">{addressFormErrors.fullName}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label text-sm font-semibold text-on-pure-white">Phone number *</label>
                      <input
                        type="tel"
                        value={addressFormData.phone}
                        onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value })}
                        className="px-3.5 py-2.5 rounded-sm border border-outline-subtle bg-pure-white text-sm"
                      />
                      {addressFormErrors.phone && (
                        <span className="text-xs text-red-600">{addressFormErrors.phone}</span>
                      )}
                    </div>
                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <label className="font-label text-sm font-semibold text-on-pure-white">Address line 1 *</label>
                      <input
                        type="text"
                        placeholder="House no., Building, Street"
                        value={addressFormData.line1}
                        onChange={(e) => setAddressFormData({ ...addressFormData, line1: e.target.value })}
                        className="px-3.5 py-2.5 rounded-sm border border-outline-subtle bg-pure-white text-sm"
                      />
                      {addressFormErrors.line1 && (
                        <span className="text-xs text-red-600">{addressFormErrors.line1}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label text-sm font-semibold text-on-pure-white">City *</label>
                      <input
                        type="text"
                        value={addressFormData.city}
                        onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
                        className="px-3.5 py-2.5 rounded-sm border border-outline-subtle bg-pure-white text-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label text-sm font-semibold text-on-pure-white">State *</label>
                      <input
                        type="text"
                        value={addressFormData.state}
                        onChange={(e) => setAddressFormData({ ...addressFormData, state: e.target.value })}
                        className="px-3.5 py-2.5 rounded-sm border border-outline-subtle bg-pure-white text-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label text-sm font-semibold text-on-pure-white">Pincode (6 digits) *</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={addressFormData.pincode}
                        onChange={(e) => setAddressFormData({ ...addressFormData, pincode: e.target.value })}
                        className="px-3.5 py-2.5 rounded-sm border border-outline-subtle bg-pure-white text-sm"
                      />
                      {addressFormErrors.pincode && (
                        <span className="text-xs text-red-600">{addressFormErrors.pincode}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label text-sm font-semibold text-on-pure-white">Label (e.g. Studio)</label>
                      <input
                        type="text"
                        value={addressFormData.label || ''}
                        onChange={(e) => setAddressFormData({ ...addressFormData, label: e.target.value })}
                        className="px-3.5 py-2.5 rounded-sm border border-outline-subtle bg-pure-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddressFormOpen(false)}
                      className="px-4 py-2 rounded-sm border border-outline-subtle text-sm font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-sm bg-deep-black text-on-deep-black text-sm font-semibold"
                    >
                      Save address
                    </button>
                  </div>
                </form>
              )}

              {/* Address Cards List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-sm border border-outline-subtle bg-light-gray flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-label text-sm font-bold text-on-pure-white">
                          {addr.fullName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {addr.label && (
                            <span className="text-xs px-2 py-0.5 rounded-sm bg-pure-white border border-outline-subtle font-semibold text-muted-gray">
                              {addr.label}
                            </span>
                          )}
                          {addr.isDefault && (
                            <span className="text-xs px-2 py-0.5 rounded-sm bg-primary-orange-tint text-accent-orange-text font-semibold">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="font-body text-sm text-muted-gray leading-relaxed">
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ''}
                        <br />
                        {addr.city}, {addr.state} — {addr.pincode}
                      </p>
                      <p className="font-body text-xs text-muted-gray mt-1">Phone: {addr.phone}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-outline-subtle text-xs">
                      {!addr.isDefault ? (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr.line1, addr.pincode)}
                          className="font-label text-primary-orange font-semibold hover:underline"
                        >
                          Make default
                        </button>
                      ) : (
                        <span className="text-muted-gray">Default delivery address</span>
                      )}
                      {addresses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.line1, addr.pincode)}
                          className="text-muted-gray hover:text-red-600 transition-colors p-1"
                          title="Delete address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </Container>
    </div>
  );
};
export default AccountPage;
