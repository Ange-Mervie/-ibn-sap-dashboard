import type { WorkspaceRole } from "../src/lib/access";
import {
  canManageUsers,
  canCreateReports,
  canReadEvaluations,
  canReadPayments,
  canReadReports,
  canReadTicket,
  canWriteComments,
  canWriteTickets,
  sameIdentity,
} from "../src/lib/access";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`ECHEC: ${message}`);
    process.exitCode = 1;
  }
}

const roles: WorkspaceRole[] = ["admin", "manager", "agent", "viewer"];

assert(canManageUsers("admin"), "ADMIN peut gérer les utilisateurs");
assert(!canManageUsers("manager"), "MANAGER ne gère pas les utilisateurs");
assert(!canManageUsers("agent"), "AGENT ne gère pas les utilisateurs");
assert(!canManageUsers("viewer"), "VIEWER ne gère pas les utilisateurs");

assert(canWriteTickets("admin", "", "admin@example.test"), "ADMIN peut écrire sur les tickets");
assert(canWriteTickets("manager", "", "manager@example.test"), "MANAGER peut superviser et modifier les tickets");
assert(canWriteTickets("agent", "agent@example.test", "agent@example.test"), "AGENT peut modifier son ticket assigné");
assert(!canWriteTickets("agent", "other@example.test", "agent@example.test"), "AGENT ne modifie pas un ticket assigné à autrui");
assert(!canWriteTickets("agent", "", "agent@example.test"), "AGENT ne modifie pas un ticket non assigné");
assert(!canWriteTickets("viewer", "viewer@example.test", "viewer@example.test"), "VIEWER ne modifie pas de ticket");
assert(canReadTicket("admin", "other@example.test", "admin@example.test"), "ADMIN lit tous les tickets");
assert(canReadTicket("viewer", "other@example.test", "viewer@example.test"), "VIEWER consulte les tickets");
assert(canReadTicket("agent", " Agent@Example.test ", "agent@example.test"), "AGENT consulte son ticket assigné");
assert(!canReadTicket("agent", "other@example.test", "agent@example.test"), "AGENT ne consulte pas le ticket d’autrui");
assert(canWriteComments("agent", "agent@example.test", "agent@example.test"), "AGENT commente son ticket");
assert(!canWriteComments("agent", "other@example.test", "agent@example.test"), "AGENT ne commente pas un ticket d’autrui");
assert(!canWriteComments("viewer", "viewer@example.test", "viewer@example.test"), "VIEWER ne commente pas");
assert(canCreateReports("admin", "", "admin@example.test"), "ADMIN crée un rapport");
assert(canCreateReports("agent", "agent@example.test", "agent@example.test"), "AGENT crée le rapport de son ticket assigné");
assert(!canCreateReports("agent", "other@example.test", "agent@example.test"), "AGENT ne crée pas de rapport pour autrui");
assert(!canCreateReports("manager", "", "manager@example.test"), "MANAGER ne soumet pas le rapport d’un agent");
assert(!canCreateReports("viewer", "viewer@example.test", "viewer@example.test"), "VIEWER ne crée pas de rapport");

assert(sameIdentity(" Agent@Example.test ", "agent@example.test"), "Identités normalisées à la casse/espaces");
assert(!sameIdentity("prefix-agent@example.test", "agent@example.test"), "Correspondance d’identité exacte, non partielle");
assert(!sameIdentity(null, "agent@example.test"), "Identité absente refusée");

assert(canReadReports("admin", "draft", "other@example.test", "admin@example.test"), "ADMIN peut lire tous les rapports du périmètre autorisé");
assert(canReadReports("manager", "submitted", "agent@example.test", "manager@example.test"), "MANAGER peut lire les rapports soumis");
assert(canReadReports("agent", "draft", " Agent@Example.test ", "agent@example.test"), "AGENT lit ses rapports");
assert(!canReadReports("agent", "draft", "other@example.test", "agent@example.test"), "AGENT ne lit pas le rapport d’autrui");
assert(canReadReports("viewer", "validated", "agent@example.test", "viewer@example.test"), "VIEWER lit un rapport validé");
assert(!canReadReports("viewer", "submitted", "agent@example.test", "viewer@example.test"), "VIEWER ne lit pas un rapport non validé");

assert(canReadEvaluations("admin", "agent@example.test", "admin@example.test"), "ADMIN lit les évaluations");
assert(canReadEvaluations("manager", "agent@example.test", "manager@example.test"), "MANAGER lit les évaluations");
assert(canReadEvaluations("agent", " Agent@Example.test ", "agent@example.test"), "AGENT lit ses évaluations");
assert(!canReadEvaluations("agent", "other@example.test", "agent@example.test"), "AGENT ne lit pas les évaluations d’autrui");
assert(!canReadEvaluations("viewer", "viewer@example.test", "viewer@example.test"), "VIEWER ne lit pas les évaluations");

assert(canReadPayments("admin", "other@example.test", "admin@example.test"), "ADMIN accède aux paiements");
assert(canReadPayments("manager", "other@example.test", "manager@example.test"), "MANAGER accède aux paiements autorisés");
assert(!canReadPayments("agent", " Agent@Example.test ", "agent@example.test"), "AGENT n’accède pas aux paiements dans cette version");
assert(!canReadPayments("viewer", "viewer@example.test", "viewer@example.test"), "VIEWER ne lit pas les paiements");

assert(roles.length === 4, "Les quatre rôles sont couverts");

if (process.exitCode) process.exit(1);
console.log("check-access: OK");