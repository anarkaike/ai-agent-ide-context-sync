#!/usr/bin/env python3
"""
DevOps Maintenance Bot - Agente especializado em manutenção de processos
Responsável por análise segura e limpeza de processos zombies e anômalos
"""

import os
import sys
import time
import signal
import logging
import subprocess
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import json

@dataclass
class ProcessInfo:
    pid: int
    ppid: int
    cmd: str
    user: str
    cpu: float
    mem: float
    status: str
    start_time: str
    is_zombie: bool = False
    is_critical: bool = False
    workspace: Optional[str] = None

class DevOpsMaintenanceBot:
    def __init__(self, dry_run: bool = True, log_level: str = "INFO"):
        self.dry_run = dry_run
        self.setup_logging(log_level)
        self.critical_processes = self.load_critical_processes()
        self.workspace_processes = self.identify_workspace_processes()
        
    def setup_logging(self, level: str):
        """Configura logging detalhado"""
        logging.basicConfig(
            level=getattr(logging, level.upper()),
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('/tmp/devops-maintenance.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        
    def load_critical_processes(self) -> Dict[str, List[str]]:
        """Carrega lista de processos críticos que não devem ser mortos"""
        return {
            'system': [
                'systemd', 'kernel', 'kthreadd', 'ksoftirqd', 'migration',
                'rcu_', 'watchdog', 'init', 'dbus', 'networkd', 'journald',
                'cron', 'sshd', 'getty', 'containerd', 'dockerd'
            ],
            'development': [
                'windsurf-server', 'language_server', 'codeium', 'mcp-server',
                'node', 'npm', 'python3', 'php-fpm', 'nginx', 'apache2'
            ],
            'databases': [
                'mysql', 'postgres', 'redis-server', 'elasticsearch',
                'mongodb', 'sqlite'
            ],
            'monitoring': [
                'grafana', 'prometheus', 'fail2ban', 'unattended-upgrades'
            ]
        }
        
    def identify_workspace_processes(self) -> Dict[str, List[int]]:
        """Identifica processos relacionados a workspaces ativos"""
        try:
            cmd = "ps aux | grep -E '(workspace|windsurf|language_server)' | grep -v grep"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            
            workspace_pids = {}
            for line in result.stdout.split('\n'):
                if 'workspace_id=' in line:
                    parts = line.split()
                    if len(parts) >= 2:
                        pid = int(parts[1])
                        workspace_match = line.split('workspace_id=')[1].split()[0] if 'workspace_id=' in line else 'unknown'
                        
                        if workspace_match not in workspace_pids:
                            workspace_pids[workspace_match] = []
                        workspace_pids[workspace_match].append(pid)
                        
            return workspace_pids
        except Exception as e:
            self.logger.error(f"Erro ao identificar workspaces: {e}")
            return {}
            
    def get_process_list(self) -> List[ProcessInfo]:
        """Obtém lista completa de processos com informações detalhadas"""
        try:
            cmd = "ps -eo pid,ppid,user,pcpu,pmem,stat,lstart,cmd --no-headers"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            
            processes = []
            for line in result.stdout.split('\n'):
                if not line.strip():
                    continue
                    
                # Split mantendo os últimos campos como comando
                parts = line.split(None, 7)  # Pega primeiros 7 campos + resto como cmd
                if len(parts) < 8:
                    continue
                    
                pid = int(parts[0])
                ppid = int(parts[1])
                user = parts[2]
                cpu = float(parts[3])
                mem = float(parts[4])
                status = parts[5]
                # start_time é composto por parts[6] (pode ter múltiplas palavras)
                # cmd é parts[7]
                cmd = parts[7]
                
                # Para start_time, precisamos parsear melhor
                # Vamos usar uma abordagem mais simples
                try:
                    # Pega tudo entre status e cmd
                    start_parts = line.split(status)[1].split(cmd)[0].strip()
                    start_time = start_parts
                except:
                    start_time = "Unknown"
                
                is_zombie = 'Z' in status
                is_critical = self.is_critical_process(cmd)
                workspace = self.extract_workspace_from_cmd(cmd)
                
                process = ProcessInfo(
                    pid=pid, ppid=ppid, cmd=cmd, user=user,
                    cpu=cpu, mem=mem, status=status,
                    start_time=start_time, is_zombie=is_zombie,
                    is_critical=is_critical, workspace=workspace
                )
                processes.append(process)
                
            return processes
        except Exception as e:
            self.logger.error(f"Erro ao obter lista de processos: {e}")
            return []
            
    def is_critical_process(self, cmd: str) -> bool:
        """Verifica se processo é crítico"""
        cmd_lower = cmd.lower()
        for category, processes in self.critical_processes.items():
            for critical_proc in processes:
                if critical_proc in cmd_lower:
                    return True
        return False
        
    def extract_workspace_from_cmd(self, cmd: str) -> Optional[str]:
        """Extrai nome do workspace do comando"""
        if 'workspace_id=' in cmd:
            try:
                workspace = cmd.split('workspace_id=')[1].split()[0]
                return workspace.replace('file_root_projects_dev_', '').replace('file_root', 'root')
            except:
                pass
        return None
        
    def analyze_zombies(self) -> Tuple[List[ProcessInfo], Dict[int, List[ProcessInfo]]]:
        """Analisa processos zombies e seus pais"""
        processes = self.get_process_list()
        zombies = [p for p in processes if p.is_zombie]
        
        # Agrupa zombies por processo pai
        zombie_groups = {}
        for zombie in zombies:
            if zombie.ppid not in zombie_groups:
                zombie_groups[zombie.ppid] = []
            zombie_groups[zombie.ppid].append(zombie)
            
        return zombies, zombie_groups
        
    def analyze_anomalous_processes(self) -> List[ProcessInfo]:
        """Identifica processos anômalos (alto consumo, antigos, etc)"""
        processes = self.get_process_list()
        anomalous = []
        
        for proc in processes:
            # Processos com alto consumo de CPU (>20%)
            if proc.cpu > 20.0 and not proc.is_critical:
                anomalous.append(proc)
                continue
                
            # Processos com alto consumo de memória (>10%)
            if proc.mem > 10.0 and not proc.is_critical:
                anomalous.append(proc)
                continue
                
            # Processos muito antigos não críticos (>24h)
            try:
                start_dt = datetime.strptime(proc.start_time, '%a %b %d %H:%M:%S %Y')
                if datetime.now() - start_dt > timedelta(hours=24) and not proc.is_critical:
                    anomalous.append(proc)
            except:
                pass
                
        return anomalous
        
    def safe_kill_process(self, pid: int, reason: str) -> bool:
        """Mata processo de forma segura com verificação"""
        if self.dry_run:
            self.logger.info(f"[DRY RUN] Mataria processo {pid} - {reason}")
            return True
            
        try:
            # Verifica se processo ainda existe
            os.kill(pid, 0)
            
            # Tenta SIGTERM primeiro
            os.kill(pid, signal.SIGTERM)
            time.sleep(2)
            
            # Verifica se ainda existe
            try:
                os.kill(pid, 0)
                # Se ainda existe, força SIGKILL
                os.kill(pid, signal.SIGKILL)
                time.sleep(1)
            except ProcessLookupError:
                pass  # Já foi morto
                
            self.logger.info(f"Processo {pid} morto com sucesso - {reason}")
            return True
            
        except ProcessLookupError:
            self.logger.warning(f"Processo {pid} não encontrado")
            return False
        except PermissionError:
            self.logger.error(f"Sem permissão para matar processo {pid}")
            return False
        except Exception as e:
            self.logger.error(f"Erro ao matar processo {pid}: {e}")
            return False
            
    def cleanup_zombies(self) -> Dict[str, int]:
        """Limpa processos zombies de forma segura"""
        zombies, zombie_groups = self.analyze_zombies()
        
        cleanup_stats = {
            'zombies_found': len(zombies),
            'parents_killed': 0,
            'zombies_cleaned': 0,
            'errors': 0
        }
        
        self.logger.info(f"Analisando {len(zombies)} processos zombies...")
        
        for ppid, zombie_list in zombie_groups.items():
            try:
                # Verifica se processo pai ainda existe
                os.kill(ppid, 0)
                
                # Verifica se é processo crítico
                parent_proc = next((p for p in self.get_process_list() if p.pid == ppid), None)
                if parent_proc and parent_proc.is_critical:
                    self.logger.warning(f"Pai {ppid} é crítico ({parent_proc.cmd}), não será morto")
                    continue
                    
                self.logger.info(f"Mantando processo pai {ppid} para limpar {len(zombie_list)} zombies")
                
                if self.safe_kill_process(ppid, f"limpeza de {len(zombie_list)} zombies"):
                    cleanup_stats['parents_killed'] += 1
                    cleanup_stats['zombies_cleaned'] += len(zombie_list)
                    
            except ProcessLookupError:
                self.logger.info(f"Pai {ppid} já não existe, zombies serão limpos pelo sistema")
                cleanup_stats['zombies_cleaned'] += len(zombie_list)
            except Exception as e:
                self.logger.error(f"Erro ao processar grupo de zombies: {e}")
                cleanup_stats['errors'] += 1
                
        return cleanup_stats
        
    def cleanup_anomalous(self) -> Dict[str, int]:
        """Limpa processos anômalos de forma segura"""
        anomalous = self.analyze_anomalous_processes()
        
        cleanup_stats = {
            'anomalous_found': len(anomalous),
            'processes_killed': 0,
            'skipped_critical': 0,
            'errors': 0
        }
        
        self.logger.info(f"Analisando {len(anomalous)} processos anômalos...")
        
        for proc in anomalous:
            if proc.is_critical:
                self.logger.warning(f"Processo {proc.pid} é crítico ({proc.cmd}), ignorado")
                cleanup_stats['skipped_critical'] += 1
                continue
                
            reason = f"CPU: {proc.cpu}%, MEM: {proc.mem}%, CMD: {proc.cmd[:50]}"
            if self.safe_kill_process(proc.pid, reason):
                cleanup_stats['processes_killed'] += 1
                
        return cleanup_stats
        
    def generate_report(self) -> Dict:
        """Gera relatório completo do sistema"""
        processes = self.get_process_list()
        zombies, zombie_groups = self.analyze_zombies()
        anomalous = self.analyze_anomalous_processes()
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'system_overview': {
                'total_processes': len(processes),
                'zombie_processes': len(zombies),
                'anomalous_processes': len(anomalous),
                'critical_processes': len([p for p in processes if p.is_critical])
            },
            'zombie_analysis': {
                'count': len(zombies),
                'by_parent': {ppid: len(zombies) for ppid, zombies in zombie_groups.items()},
                'details': [
                    {
                        'pid': z.pid,
                        'ppid': z.ppid,
                        'cmd': z.cmd,
                        'user': z.user
                    } for z in zombies
                ]
            },
            'workspace_analysis': self.workspace_processes,
            'recommendations': self.generate_recommendations(zombies, anomalous)
        }
        
        return report
        
    def generate_recommendations(self, zombies: List[ProcessInfo], anomalous: List[ProcessInfo]) -> List[str]:
        """Gera recomendações baseadas na análise"""
        recommendations = []
        
        if zombies:
            recommendations.append(f"Limpar {len(zombies)} processos zombies matando processos pais")
            
        if anomalous:
            recommendations.append(f"Revisar {len(anomalous)} processos anômalos com alto consumo")
            
        # Verifica workspaces duplicados
        workspace_counts = {}
        for proc in self.get_process_list():
            if proc.workspace:
                workspace_counts[proc.workspace] = workspace_counts.get(proc.workspace, 0) + 1
                
        duplicated = [ws for ws, count in workspace_counts.items() if count > 3]
        if duplicated:
            recommendations.append(f"Workspaces com muitos processos: {duplicated}")
            
        return recommendations
        
    def run_maintenance(self) -> Dict:
        """Executa ciclo completo de manutenção"""
        self.logger.info("Iniciando ciclo de manutenção DevOps...")
        
        if self.dry_run:
            self.logger.warning("MODO DRY RUN - Nenhum processo será morto")
            
        results = {
            'timestamp': datetime.now().isoformat(),
            'dry_run': self.dry_run,
            'zombie_cleanup': self.cleanup_zombies(),
            'anomalous_cleanup': self.cleanup_anomalous(),
            'report': self.generate_report()
        }
        
        # Salva relatório
        with open('/tmp/devops-maintenance-report.json', 'w') as f:
            json.dump(results, f, indent=2, default=str)
            
        self.logger.info("Ciclo de manutenção concluído")
        return results

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='DevOps Maintenance Bot')
    parser.add_argument('--dry-run', action='store_true', help='Simulação (não mata processos)')
    parser.add_argument('--execute', action='store_true', help='Executa limpeza real')
    parser.add_argument('--report-only', action='store_true', help='Apenas gera relatório')
    parser.add_argument('--log-level', default='INFO', choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'])
    
    args = parser.parse_args()
    
    # Modo de segurança padrão é dry-run
    dry_run = not args.execute
    
    bot = DevOpsMaintenanceBot(dry_run=dry_run, log_level=args.log_level)
    
    if args.report_only:
        report = bot.generate_report()
        print(json.dumps(report, indent=2, default=str))
    else:
        results = bot.run_maintenance()
        print(json.dumps(results, indent=2, default=str))

if __name__ == '__main__':
    main()
