import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  session: Session | null
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name
          }
        }
      })

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no cadastro",
          description: error.message,
        })
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Você foi cadastrado com sucesso.",
        })
      }

      return { error }
    } catch (error: any) {
      const errorMsg = error.message || "Erro inesperado"
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: errorMsg,
      })
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: error.message,
        })
      } else {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao sistema.",
        })
      }

      return { error }
    } catch (error: any) {
      const errorMsg = error.message || "Erro inesperado"
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: errorMsg,
      })
      return { error }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      toast({
        title: "Logout realizado",
        description: "Você saiu do sistema.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no logout",
        description: error.message,
      })
    }
  }

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}