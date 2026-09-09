import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  redirects() {
    return [
      { source: "/login", destination: "/acceso", permanent: true },
      { source: "/cuenta", destination: "/perfil", permanent: true },
      { source: "/usuarios", destination: "/perfil", permanent: true },
      { source: "/historial", destination: "/citas", permanent: true },
      { source: "/ventas", destination: "/citas", permanent: true },
      { source: "/inventario", destination: "/agendar", permanent: true },
      { source: "/productos", destination: "/especialidades", permanent: true },
      { source: "/proveedores", destination: "/profesionales", permanent: true },
      { source: "/reportes", destination: "/resumen", permanent: true },
      { source: "/dashboard", destination: "/resumen", permanent: true },
      { source: "/api/inventario", destination: "/api/portal", permanent: true },
      { source: "/api/productos", destination: "/api/especialidades", permanent: true },
      { source: "/api/proveedores", destination: "/api/medicos", permanent: true },
      { source: "/api/reportes", destination: "/api/portal", permanent: true },
      { source: "/api/usuarios", destination: "/api/pacientes", permanent: true },
      { source: "/api/ventas", destination: "/api/citas", permanent: true }
    ];
  }
};

export default nextConfig;
