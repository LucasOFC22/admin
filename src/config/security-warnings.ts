// Sistema de avisos de segurança para desenvolvimento
export class SecurityWarnings {
  private static hasShownWarnings = false;
  
  static checkAndWarnAboutSecurity(): void {
    // Silenciado por segurança - não exibir informações de configuração no console
    return;
  }
  
  static logProductionSecurity(): void {
    // Silenciado por segurança - não exibir informações de configuração no console
    return;
  }
}

// Auto-executar verificação em desenvolvimento
if (import.meta.env.MODE === 'development') {
  SecurityWarnings.checkAndWarnAboutSecurity();
} else {
  SecurityWarnings.logProductionSecurity();
}