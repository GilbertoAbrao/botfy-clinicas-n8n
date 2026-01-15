import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-gradient-to-br from-botfy-primary-light to-white">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Logo className="flex items-center justify-center mb-4" />
          <CardTitle>Console Administrativo</CardTitle>
          <CardDescription>
            Sistema de gestão para clínicas
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button className="w-full bg-botfy-primary hover:bg-botfy-primary/90">
            Acessar Sistema
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Botfy ClinicOps v0.1.0
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
