import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
export const routes: Routes = [
 {path:'login',loadComponent:()=>import('./features/auth/login.component').then(m=>m.LoginComponent)},
 {path:'register',loadComponent:()=>import('./features/auth/register.component').then(m=>m.RegisterComponent)},
 {path:'not-authorized',loadComponent:()=>import('./features/auth/not-authorized.component').then(m=>m.NotAuthorizedComponent)},
 {path:'',loadComponent:()=>import('./layout/shell.component').then(m=>m.ShellComponent),canActivate:[authGuard],children:[
  {path:'app',canActivate:[roleGuard],data:{roles:['Applicant']},children:[
   {path:'dashboard',loadComponent:()=>import('./features/applicant/applicant-dashboard.component').then(m=>m.ApplicantDashboardComponent)},
   {path:'apply',loadComponent:()=>import('./features/applicant/loan-wizard.component').then(m=>m.LoanWizardComponent)},
   {path:'apply/:id',loadComponent:()=>import('./features/applicant/loan-wizard.component').then(m=>m.LoanWizardComponent)},
   {path:'applications',loadComponent:()=>import('./features/applicant/my-applications.component').then(m=>m.MyApplicationsComponent)},
   {path:'applications/:id',loadComponent:()=>import('./features/applicant/application-status.component').then(m=>m.ApplicationStatusComponent)},
   {path:'profile',loadComponent:()=>import('./features/auth/profile.component').then(m=>m.ProfileComponent)},
   {path:'',pathMatch:'full',redirectTo:'dashboard'}]},
  {path:'processor',canActivate:[roleGuard],data:{roles:['Processor']},children:[
   {path:'dashboard',loadComponent:()=>import('./features/processor/processor-dashboard.component').then(m=>m.ProcessorDashboardComponent)},
   {path:'worklist',loadComponent:()=>import('./features/processor/processor-worklist.component').then(m=>m.ProcessorWorklistComponent)},
   {path:'applications/:id',loadComponent:()=>import('./features/processor/application-review.component').then(m=>m.ApplicationReviewComponent)},
   {path:'profile',loadComponent:()=>import('./features/auth/profile.component').then(m=>m.ProfileComponent)},
   {path:'',pathMatch:'full',redirectTo:'dashboard'}]},
  {path:'underwriter',canActivate:[roleGuard],data:{roles:['Underwriter']},children:[
   {path:'dashboard',loadComponent:()=>import('./features/underwriter/underwriter-dashboard.component').then(m=>m.UnderwriterDashboardComponent)},
   {path:'worklist',loadComponent:()=>import('./features/underwriter/underwriter-worklist.component').then(m=>m.UnderwriterWorklistComponent)},
   {path:'applications/:id',loadComponent:()=>import('./features/underwriter/underwriter-decision.component').then(m=>m.UnderwriterDecisionComponent)},
   {path:'profile',loadComponent:()=>import('./features/auth/profile.component').then(m=>m.ProfileComponent)},
   {path:'',pathMatch:'full',redirectTo:'dashboard'}]},
  {path:'admin',canActivate:[roleGuard],data:{roles:['Admin']},children:[
   {path:'dashboard',loadComponent:()=>import('./features/admin/admin-dashboard.component').then(m=>m.AdminDashboardComponent)},
   {path:'users',loadComponent:()=>import('./features/admin/admin-users.component').then(m=>m.AdminUsersComponent)},
   {path:'audit',loadComponent:()=>import('./features/admin/admin-audit.component').then(m=>m.AdminAuditComponent)},
   {path:'profile',loadComponent:()=>import('./features/auth/profile.component').then(m=>m.ProfileComponent)},
   {path:'',pathMatch:'full',redirectTo:'dashboard'}]},
  {path:'',pathMatch:'full',loadComponent:()=>import('./features/auth/role-home.component').then(m=>m.RoleHomeComponent)},
  {path:'**',loadComponent:()=>import('./features/auth/not-found.component').then(m=>m.NotFoundComponent)}
 ]},
 {path:'**',redirectTo:'login'}
];
