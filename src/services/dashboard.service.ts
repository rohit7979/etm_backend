import { Types } from 'mongoose';
import { Training } from '../models/Training';
import { Assignment } from '../models/Assignment';
import { User } from '../models/User';

export class DashboardService {
  static async getAdminDashboard(companyId: string) {
    const cId = new Types.ObjectId(companyId);

    const [
      totalTrainings,
      totalAssignments,
      completedAssignments,
      inProgressAssignments,
      pendingAssignments,
      totalEmployees,
      activeEmployeesList,
    ] = await Promise.all([
      Training.countDocuments({ companyId: cId }),
      Assignment.countDocuments({ companyId: cId }),
      Assignment.countDocuments({ companyId: cId, status: 'completed' }),
      Assignment.countDocuments({ companyId: cId, status: 'in_progress' }),
      Assignment.countDocuments({ companyId: cId, status: 'pending' }),
      User.countDocuments({ companyId: cId, role: 'EMPLOYEE' }),
      Assignment.distinct('employee', { companyId: cId }),
    ]);

    const avgCompletionRate =
      totalAssignments > 0
        ? Math.round((completedAssignments / totalAssignments) * 100)
        : 0;

    return {
      totalTrainings,
      totalAssignments,
      completedAssignments,
      inProgressAssignments,
      pendingAssignments,
      avgCompletionRate,
      totalEmployees,
      activeEmployees: activeEmployeesList.length,
    };
  }

  static async getAdminAnalytics(companyId: string) {
    const cId = new Types.ObjectId(companyId);

    // 1. Status Breakdown
    const [completedCount, inProgressCount, pendingCount] = await Promise.all([
      Assignment.countDocuments({ companyId: cId, status: 'completed' }),
      Assignment.countDocuments({ companyId: cId, status: 'in_progress' }),
      Assignment.countDocuments({ companyId: cId, status: 'pending' }),
    ]);

    const statusBreakdown = [
      { status: 'completed', count: completedCount },
      { status: 'in_progress', count: inProgressCount },
      { status: 'pending', count: pendingCount },
    ];

    // 2. Category Breakdown
    const assignmentsWithCategory = await Assignment.aggregate([
      { $match: { companyId: cId } },
      {
        $lookup: {
          from: 'trainings',
          localField: 'training',
          foreignField: '_id',
          as: 'trainingDoc',
        },
      },
      { $unwind: '$trainingDoc' },
      {
        $group: {
          _id: '$trainingDoc.category',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const categoryBreakdown = assignmentsWithCategory.map((item) => ({
      category: item._id || 'General',
      total: item.total,
      completed: item.completed,
      inProgress: item.inProgress,
      pending: item.pending,
    }));

    // 3. Monthly Trends (Last 6 Months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyTrends: { year: number; month: number; label: string; completed: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const count = await Assignment.countDocuments({
        companyId: cId,
        status: 'completed',
        completedAt: { $gte: startOfMonth, $lte: endOfMonth },
      });

      monthlyTrends.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        label: monthNames[d.getMonth()],
        completed: count,
      });
    }

    // 4. Top 5 Employees by Completion
    const employeeAgg = await Assignment.aggregate([
      { $match: { companyId: cId } },
      {
        $group: {
          _id: '$employee',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDoc',
        },
      },
      { $unwind: '$userDoc' },
      { $sort: { completed: -1, total: -1 } },
      { $limit: 5 },
    ]);

    const topEmployees = employeeAgg.map((item) => {
      const rate = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
      return {
        name: item.userDoc.name || 'Unknown',
        total: item.total,
        completed: item.completed,
        completionRate: rate,
      };
    });

    return {
      statusBreakdown,
      categoryBreakdown,
      monthlyTrends,
      topEmployees,
    };
  }

  static async getEnrichedEmployees(companyId: string) {
    const employees = await User.find({
      companyId,
      role: 'EMPLOYEE',
    })
      .select('name email role status createdAt')
      .sort({ createdAt: -1 });

    const enriched = await Promise.all(
      employees.map(async (emp) => {
        const [totalAssignments, completedAssignments] = await Promise.all([
          Assignment.countDocuments({ companyId, employee: emp._id }),
          Assignment.countDocuments({ companyId, employee: emp._id, status: 'completed' }),
        ]);

        return {
          id: emp._id.toString(),
          _id: emp._id.toString(),
          name: emp.name,
          email: emp.email,
          role: emp.role,
          status: emp.status,
          joinedAt: emp.createdAt,
          totalAssignments,
          completedAssignments,
          pendingAssignments: totalAssignments - completedAssignments,
        };
      })
    );

    return {
      count: enriched.length,
      employees: enriched,
    };
  }
}
