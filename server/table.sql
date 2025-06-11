create table countries
(
    country_id   int auto_increment
        primary key,
    country_name varchar(100) not null
);

create table departments
(
    department_id   int auto_increment
        primary key,
    department_name varchar(100) not null
);

create table employees
(
    employee_id   int auto_increment
        primary key,
    first_name    varchar(50)    not null,
    last_name     varchar(50)    not null,
    department_id int            null,
    manager_id    int            null,
    hire_date     date           not null,
    salary        decimal(10, 2) null,
    location_id   int            null
);

create table locations
(
    location_id   int auto_increment
        primary key,
    location_name varchar(100) not null,
    country_id    int          null
);

create table query_reports
(
    query_report_id int auto_increment
        primary key,
    name            text null,
    description     text null,
    variables       text null,
    query           text null,
    disabled        int  null,
    admin_only      int  null,
    is_deleted      int  null,
    constraint query_reports_id
        unique (query_report_id)
);

