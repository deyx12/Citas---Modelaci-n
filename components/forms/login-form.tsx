import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  return (
    <form>
      <Input name="email" type="email" placeholder="correo@ejemplo.com" />
      <Input name="password" type="password" placeholder="Contrasena" />
      <Button type="submit">Entrar</Button>
    </form>
  );
}
