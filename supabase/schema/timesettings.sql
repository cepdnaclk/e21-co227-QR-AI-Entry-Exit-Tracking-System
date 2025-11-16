-- Set default timezone to Asia/Colombo for database and roles

ALTER DATABASE postgres SET timezone = 'Asia/Colombo';
ALTER ROLE postgres SET timezone = 'Asia/Colombo';
ALTER ROLE anon SET timezone = 'Asia/Colombo';
ALTER ROLE authenticated SET timezone = 'Asia/Colombo';
ALTER ROLE service_role SET timezone = 'Asia/Colombo';
