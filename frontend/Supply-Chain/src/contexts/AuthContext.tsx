
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();


  useEffect(() => {
    console.log("AuthProvider: useEffect for auth processing is running.");

    const processAuth = async () => {
      try {
        console.log("AuthProvider: Checking for redirect result...");
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("AuthProvider: Google redirect result found.", result.user);
          toast({ title: "Logged in successfully!" });
           // The router logic to redirect is in AppLayout to avoid context/router conflicts
        } else {
          console.log("AuthProvider: No redirect result.");
        }
      } catch (error: any) {
        console.error("AuthProvider: Error during getRedirectResult:", error);
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message || "Could not complete sign-in. Please try again.",
        });
      }

      console.log("AuthProvider: Setting up onAuthStateChanged listener.");
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        console.log("AuthProvider: onAuthStateChanged triggered. User:", currentUser);
        setUser(currentUser);
        if (loading) {
            console.log("AuthProvider: Auth loading finished.");
            setLoading(false);
        }
      });
      
      return unsubscribe;
    };

    const unsubscribePromise = processAuth();

    return () => {
      console.log("AuthProvider: Cleaning up auth useEffect.");
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) {
          console.log("AuthProvider: Unsubscribing from onAuthStateChanged.");
          unsubscribe();
        }
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
