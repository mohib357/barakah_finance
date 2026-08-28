export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { UserSystemRole } from "@/types/enums";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await requireSession();
    if (![UserSystemRole.ADMIN, UserSystemRole.SUPER_ADMIN].includes(session.user.systemRole as never)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const now = new Date();

    const [
      totalMembers, totalUsers,
      pendingApplications, pendingKYC,
      activeOrders, overdueInstallments,
      activeQard, pendingQard,
      lowStockProducts,
      totalIncomeAgg, totalExpenseAgg,
      pendingReviews,
      recentActivity,
      savingsAgg,
    ] = await Promise.all([
      prisma.member.count({ where: { status: "APPROVED" } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.memberApplication.count({ where: { status: "PENDING" } }),
      prisma.userKYC.count({ where: { status: "SUBMITTED" } }),
      prisma.order.count({ where: { status: { in: ["APPROVED","COMPLETED"] as never[], }, totalRemaining: { gt: 0 } } }),
      prisma.installment.count({ where: { status: "OVERDUE" as never, dueDate: { lt: now } } }),
      prisma.qardApplication.count({ where: { status: "ACTIVE" as never } }),
      prisma.qardApplication.count({ where: { status: { in: ["APPLIED","UNDER_REVIEW"] as never[] } } }),
      prisma.product.count({ where: { isActive: true, stockQty: { lte: 2 } } }),
      prisma.incomeEntry.aggregate({ where: { isDeleted: false }, _sum: { amount: true } }),
      prisma.expenseEntry.aggregate({ where: { isDeleted: false }, _sum: { amount: true } }),
      prisma.review.count({ where: { status: "PENDING" } }),
      prisma.activityFeed.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.savingsRecord.aggregate({ where: { status: "PAID" }, _sum: { paidAmount: true } }),
    ]);

    const totalIncome  = Number(totalIncomeAgg._sum.amount  ?? 0);
    const totalExpense = Number(totalExpenseAgg._sum.amount ?? 0);
    const totalSavings = Number(savingsAgg._sum.paidAmount  ?? 0);

    // Today's birthdays from member profiles
    const todayMonth = now.getMonth() + 1;
    const todayDay   = now.getDate();
    const birthdays  = await prisma.userProfile.count({
      where: {
        dateOfBirth: {
          not: null,
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalMembers,
        totalUsers,
        pendingApplications,
        pendingKYC,
        activeOrders,
        overdueInstallments,
        activeQard,
        pendingQard,
        lowStockProducts,
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        pendingReviews,
        totalSavings,
        todayBirthdays: 0, // computed separately with JS date logic
      },
      pendingActions: {
        membership:   pendingApplications,
        kyc:          pendingKYC,
        orders:       0,
        qard:         pendingQard,
        overdue:      overdueInstallments,
        lowStock:     lowStockProducts,
        reviews:      pendingReviews,
      },
      recentActivity: recentActivity.map((a) => ({
        action:    a.action,
        module:    a.module,
        detail:    a.detail,
        userName:  a.userName,
        createdAt: a.createdAt,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
