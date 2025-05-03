"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
function hashPassword(password) {
    return __awaiter(this, void 0, void 0, function* () {
        const saltRounds = 10;
        return yield bcrypt.hash(password, saltRounds);
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Admin rolü oluştur
            const adminRole = yield prisma.role.create({
                data: {
                    name: "Admin",
                    description: "Sistem yöneticisi",
                    permissions: {
                        "users.view": true,
                        "users.create": true,
                        "users.edit": true,
                        "users.delete": true,
                        "departments.view": true,
                        "departments.create": true,
                        "departments.edit": true,
                        "departments.delete": true,
                        "projects.view": true,
                        "projects.create": true,
                        "projects.edit": true,
                        "projects.delete": true,
                        "tasks.view": true,
                        "tasks.create": true,
                        "tasks.edit": true,
                        "tasks.delete": true,
                    },
                },
            });
            console.log("Admin rolü oluşturuldu:", adminRole);
            // Kullanıcı şifresini hashle
            const passwordHash = yield hashPassword("Admin123!");
            // Admin kullanıcısı oluştur
            const adminUser = yield prisma.user.create({
                data: {
                    email: "admin@aydem.com",
                    name: "Admin",
                    surname: "Kullanıcı",
                    passwordHash,
                    roleId: adminRole.id,
                },
            });
            console.log("Admin kullanıcısı oluşturuldu:", {
                id: adminUser.id,
                email: adminUser.email,
                name: adminUser.name,
            });
            // --- YENİ ADMIN KULLANICISI EKLEME BAŞLANGICI ---
            console.log("\nAhmet Yılmaz kullanıcısı oluşturuluyor...");
            // Ahmet Yılmaz için şifreyi hashle
            const ahmetPasswordHash = yield hashPassword("123456");
            // Ahmet Yılmaz kullanıcısını oluştur
            const ahmetAdminUser = yield prisma.user.create({
                data: {
                    email: "ahmet.yilmaz@aeys.com",
                    name: "Ahmet",
                    surname: "Yılmaz",
                    passwordHash: ahmetPasswordHash, // Hashlenmiş şifreyi kullan
                    roleId: adminRole.id, // Mevcut admin rolünü ata
                    // Gerekirse departman ata:
                    // departmentId: departmentYonetim.id,
                },
            });
            console.log("Ahmet Yılmaz admin kullanıcısı oluşturuldu:", {
                id: ahmetAdminUser.id,
                email: ahmetAdminUser.email,
                name: ahmetAdminUser.name,
                surname: ahmetAdminUser.surname,
            });
            // --- YENİ ADMIN KULLANICISI EKLEME SONU ---
            // Personel rolü oluştur
            const employeeRole = yield prisma.role.create({
                data: {
                    name: "Personel",
                    description: "Genel personel",
                    permissions: {
                        "projects.view": true,
                        "tasks.view": true,
                        "tasks.create": true,
                        "tasks.edit": true,
                    },
                },
            });
            console.log("Personel rolü oluşturuldu:", employeeRole);
            // Örnek departmanlar oluştur
            const departmentYonetim = yield prisma.department.create({
                data: {
                    name: "Yönetim",
                    description: "Şirket yönetim departmanı",
                },
            });
            console.log("Yönetim departmanı oluşturuldu:", departmentYonetim);
            const departmentTeknik = yield prisma.department.create({
                data: {
                    name: "Teknik",
                    description: "Teknik işler departmanı",
                },
            });
            console.log("Teknik departmanı oluşturuldu:", departmentTeknik);
            // Örnek müşteri oluştur
            const customer = yield prisma.customer.create({
                data: {
                    name: "ABC Elektrik Ltd. Şti.",
                    status: "ACTIVE"
                },
            });
            console.log("Müşteri oluşturuldu:", customer);
            // Örnek proje oluştur
            const project = yield prisma.project.create({
                data: {
                    name: "İzmir Trafo Bakım Projesi",
                    description: "İzmir bölgesi trafo bakım ve onarım projesi",
                    status: "IN_PROGRESS",
                    startDate: new Date(),
                    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
                    budget: 250000,
                    departmentId: departmentTeknik.id,
                    customerId: customer.id,
                },
            });
            console.log("Proje oluşturuldu:", project);
            // Örnek görev oluştur
            const task = yield prisma.task.create({
                data: {
                    title: "Saha keşif çalışması",
                    description: "İzmir bölgesi trafo lokasyonlarının keşfi",
                    status: "IN_PROGRESS",
                    priority: "HIGH",
                    startDate: new Date(),
                    dueDate: new Date(new Date().setDate(new Date().getDate() + 14)),
                    estimatedHours: 40,
                    projectId: project.id,
                    createdById: adminUser.id,
                    assignees: {
                        connect: [{ id: adminUser.id }],
                    },
                },
            });
            console.log("Görev oluşturuldu:", task);
            // Test kullanıcısı oluştur
            const testPasswordHash = yield hashPassword("test123");
            const testUser = yield prisma.user.create({
                data: {
                    email: "test@aeys.com",
                    name: "Test",
                    surname: "Kullanıcı",
                    passwordHash: testPasswordHash,
                    roleId: employeeRole.id,
                    employee: {
                        create: {
                            departmentId: departmentTeknik.id,
                            position: "Test Teknisyeni",
                            phoneNumber: "555-123-4567",
                        }
                    }
                },
            });
            console.log("Test kullanıcısı oluşturuldu:", {
                id: testUser.id,
                email: testUser.email,
                name: testUser.name,
                surname: testUser.surname,
                role: "Personel"
            });
        }
        catch (error) {
            console.error("Seed hatası:", error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
