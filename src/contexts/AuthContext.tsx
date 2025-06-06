
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface BankDetails {
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  gstNumber?: string;
  contactPerson?: string;
  mobileNumber?: string;
  bankDetails?: BankDetails;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (data: { name: string; email: string; password: string; companyName?: string; gstNumber?: string; contactPerson?: string; mobileNumber?: string }) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ error: string | null }>;
  updateBankDetails: (bankDetails: BankDetails) => Promise<{ error: string | null }>;
  loading: boolean;
  loginAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setUser({
          id: data.id,
          name: data.name,
          email: data.email,
          companyName: data.company_name,
          gstNumber: data.gst_number,
          contactPerson: data.contact_person,
          mobileNumber: data.mobile_number,
          bankDetails: data.bank_details
        });
      } else {
        // Create profile if it doesn't exist
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email || '',
            company_name: ''
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
        } else if (newProfile) {
          setUser({
            id: newProfile.id,
            name: newProfile.name,
            email: newProfile.email,
            companyName: newProfile.company_name,
            gstNumber: newProfile.gst_number,
            contactPerson: newProfile.contact_person,
            mobileNumber: newProfile.mobile_number,
            bankDetails: newProfile.bank_details
          });
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Login failed' };
    }
  };

  const register = async (data: { name: string; email: string; password: string; companyName?: string; gstNumber?: string; contactPerson?: string; mobileNumber?: string }) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            company_name: data.companyName || ''
          }
        }
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      if (!user) return { error: 'Not authenticated' };

      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.companyName !== undefined) updateData.company_name = data.companyName;
      if (data.gstNumber !== undefined) updateData.gst_number = data.gstNumber;
      if (data.contactPerson !== undefined) updateData.contact_person = data.contactPerson;
      if (data.mobileNumber !== undefined) updateData.mobile_number = data.mobileNumber;

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        return { error: error.message };
      }

      setUser(prev => prev ? { ...prev, ...data } : null);
      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Update failed' };
    }
  };

  const updateBankDetails = async (bankDetails: BankDetails) => {
    try {
      if (!user) return { error: 'Not authenticated' };

      const { error } = await supabase
        .from('profiles')
        .update({ bank_details: bankDetails })
        .eq('id', user.id);

      if (error) {
        return { error: error.message };
      }

      setUser(prev => prev ? { ...prev, bankDetails } : null);
      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Update failed' };
    }
  };

  const loginAsGuest = () => {
    const guestUser: UserProfile = {
      id: 'guest-user-id',
      name: 'Guest User',
      email: 'guest@example.com',
      companyName: 'Guest Company'
    };
    setUser(guestUser);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      login,
      register,
      logout,
      updateProfile,
      updateBankDetails,
      loading,
      loginAsGuest
    }}>
      {children}
    </AuthContext.Provider>
  );
};
