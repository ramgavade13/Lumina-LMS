/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'student' | 'admin';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  fullName: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
}

export interface Transaction {
  id: number;
  bookId: number;
  studentId: number;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  fine: number;
  // Joined fields
  bookTitle?: string;
  studentName?: string;
}

export interface Student extends User {
  studentId: string;
  email: string;
}

export interface DashboardStats {
  totalBooks: number;
  availableBooks: number;
  issuedBooks: number;
  totalStudents: number;
  overdueBooks: number;
}
