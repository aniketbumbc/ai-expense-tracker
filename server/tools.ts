import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { DatabaseSync } from 'node:sqlite';

export const initTools = (db: DatabaseSync, userId: number) => {
  /***
   * add_expense
   * description: Add a new expense to the expense tracker
   * parameters:
   * - title: The title of the expense
   * - amount: The amount of the expense
   */
  const addExpense = tool(
    ({ title, amount }) => {
      console.log(`Adding expense: ${title} - $${amount} (user ${userId})`);

      // todo validation data type

      try {
        const date = new Date().toISOString().split('T')[0];
        const statement = `INSERT INTO expenses (user_id, title, amount, date) VALUES (?, ?, ?, ?)`;
        db.prepare(statement).run(userId, title, amount, date);

        return JSON.stringify({
          success: true,
          message: `Expense ${title} added successfully`,
        });
      } catch (error) {
        console.error('add_expense failed:', error);
        return JSON.stringify({
          success: false,
          message: 'Failed to add expense due to a server error',
        });
      }
    },
    {
      name: 'add_expense',
      description: 'Add a new expense to the expense tracker',
      schema: z.object({
        title: z.string().describe('The title of the expense'),
        amount: z.number().describe('The amount of the expense'),
      }),
    },
  );

  /***
   * get_expenses
   * description: Get all expenses from the expense tracker
   * parameters:
   * - None
   */

  const getExpenses = tool(
    ({ fromDate, toDate }) => {
      console.log(
        `Getting expenses from ${fromDate} to ${toDate} (user ${userId})`,
      );

      // todo validation data type

      try {
        const statement = `SELECT title, amount, date FROM expenses WHERE user_id = ? AND date BETWEEN ? AND ?`;
        const expenses = db.prepare(statement).all(userId, fromDate, toDate);
        console.log(expenses);

        if (expenses.length === 0) {
          return JSON.stringify({
            message: 'You do not have any expenses at moment',
          });
        }

        return JSON.stringify(expenses);
      } catch (error) {
        console.error('get_expenses failed:', error);
        return JSON.stringify({
          message: 'Failed to fetch expenses due to a server error',
        });
      }
    },
    {
      name: 'get_expenses',
      description:
        'Get the total amount of expenses from the database between two dates',
      schema: z.object({
        fromDate: z
          .string()
          .describe('The start date of the expense YYYY-MM-DD'),
        toDate: z.string().describe('The end date of the expense YYYY-MM-DD'),
      }),
    },
  );

  /**
   *  Generate expense chart
   */

  const generateExpenseChart = tool(
    ({ fromDate, toDate, groupByData }) => {
      console.log(`generateExpenseChart (user ${userId})`);
      console.log(`by grouping by ${groupByData}`);

      // todo validation data type

      try {
        let sqlGroupBy = '';

        switch (groupByData) {
          case 'month':
            sqlGroupBy = `strftime('%Y-%m', date)`;
            break;
          case 'week':
            sqlGroupBy = `strftime('%Y-W%W', date)`;
            break;
          case 'date':
            sqlGroupBy = `strftime('%Y-%m-%d', date)`;
            break;
          default:
            sqlGroupBy = `strftime('%Y-%m', date)`;
        }

        const statement = `SELECT ${sqlGroupBy} as period, SUM(amount) as total FROM expenses WHERE user_id = ? AND date BETWEEN ? AND ? GROUP BY period ORDER BY period`;
        const expenses = db.prepare(statement).all(userId, fromDate, toDate);

        const result = expenses.map((expense) => ({
          [groupByData]: expense.period,
          amount: expense.total,
        }));

        return JSON.stringify({
          type: 'chart',
          data: result,
          labelKey: groupByData,
        });
      } catch (error) {
        console.error('generate_expense_chart failed:', error);
        return JSON.stringify({
          type: 'error',
          message: 'Failed to generate expense chart due to a server error',
        });
      }
    },
    {
      name: 'generate_expense_chart',
      description:
        'Generate expense chart by query database and grouping expenses by month or week or year or date',
      schema: z.object({
        fromDate: z
          .string()
          .describe('The start date of the expense YYYY-MM-DD'),
        toDate: z.string().describe('The end date of the expense YYYY-MM-DD'),
        groupByData: z
          .enum(['date', 'week', 'month', 'year'])
          .describe(
            'How to group the expenses data: by month or week or year or date',
          ),
      }),
    },
  );
  return [addExpense, getExpenses, generateExpenseChart];
};
