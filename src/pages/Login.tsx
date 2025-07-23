import { useState } from "react"
import { Eye, EyeOff, Monitor, ArrowRight, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    recoveryData: ""
  })
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate login
    setTimeout(() => {
      setIsLoading(false)
      if (formData.email && formData.password) {
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para o sistema...",
        })
        navigate("/clients")
      } else {
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: "Verifique suas credenciais e tente novamente.",
        })
      }
    }, 1500)
  }

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Recuperação enviada!",
        description: "Instruções foram enviadas para seu e-mail.",
      })
      setFormData({ ...formData, recoveryData: "" })
    }, 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/10 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Monitor className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Gerenciador Online</h1>
          <p className="text-muted-foreground mt-2">Sistema de Gestão Completo</p>
        </div>

        <Card className="shadow-elegant border-border bg-gradient-card">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Acesso ao Sistema</CardTitle>
            <CardDescription>
              Faça login ou recupere sua senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="recovery">Recuperar Senha</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Digite sua senha"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="h-11 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 mt-6" 
                    disabled={isLoading}
                    variant="premium"
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="recovery">
                <form onSubmit={handleRecovery} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recoveryData">CPF, Telefone ou Nome de Usuário</Label>
                    <Input
                      id="recoveryData"
                      placeholder="Digite seu CPF, telefone ou usuário"
                      value={formData.recoveryData}
                      onChange={(e) => setFormData({ ...formData, recoveryData: e.target.value })}
                      className="h-11"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 mt-6" 
                    disabled={isLoading}
                    variant="secondary"
                  >
                    {isLoading ? "Enviando..." : "Recuperar Senha"}
                    <KeyRound className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-xs text-muted-foreground">
          <p>© 2024 Gerenciador Online - Versão 1.0.0</p>
        </div>
      </div>
    </div>
  )
}