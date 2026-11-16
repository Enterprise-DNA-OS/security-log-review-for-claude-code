insert into workspace(id,name,demo) values(true,'Harbour Demo Systems',true) on conflict do nothing;
insert into sources(id,name,owner,gap_hours,retention_days,policy_basis,review_due,security_review_ref) values
('10000000-0000-0000-0000-000000000001','HARBOUR-AD01','Mere',24,180,'Demo policy: review imports daily; retain 180 days',current_date+30,'Demo access review AR-01'),
('10000000-0000-0000-0000-000000000002','HARBOUR-VPN','Aroha',12,90,'Demo VPN policy',current_date-5,''),
('10000000-0000-0000-0000-000000000003','HARBOUR-FILES','',null,null,'',null,'') on conflict do nothing;
insert into events(id,fingerprint,source_id,occurred_at,actor,action,outcome,event_code,severity,message,raw_record)
select ('20000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'demo-'||n,'10000000-0000-0000-0000-000000000001',now()-(30-n)*interval '1 minute','demo.user','logon','failure','4625','warning','Fictional failed sign-in',jsonb_build_object('demo',true,'sequence',n) from generate_series(1,4) n on conflict do nothing;
insert into events(id,fingerprint,source_id,occurred_at,actor,action,outcome,event_code,severity,message,raw_record) values
('20000000-0000-0000-0000-000000000005','demo-5','10000000-0000-0000-0000-000000000001',now()-interval '10 minutes','demo.user','logon','success','4624','information','Fictional successful sign-in','{"demo":true}'),
('20000000-0000-0000-0000-000000000006','demo-6','10000000-0000-0000-0000-000000000001',now()-interval '8 minutes','demo.admin','group membership change','success','4728','critical','Fictional privileged group change','{"demo":true}'),
('20000000-0000-0000-0000-000000000007','demo-7','10000000-0000-0000-0000-000000000002',now()-interval '4 days','','remote access','','','warning','Fictional incomplete VPN record','{"demo":true}'),
('20000000-0000-0000-0000-000000000008','demo-8','10000000-0000-0000-0000-000000000001',now()-interval '200 days','demo.old','logon','success','4624','information','Fictional retention review item','{"demo":true}') on conflict do nothing;
insert into cases(id,code,title,owner,due_on) values
('30000000-0000-0000-0000-000000000001','LOG-101','Repeated sign-ins before a success','Mere',current_date-2),
('30000000-0000-0000-0000-000000000002','LOG-102','VPN export gap','Aroha',current_date+2) on conflict do nothing;
insert into case_events(id,case_id,event_id,rationale) values
('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Demo analyst selected this event for review') on conflict do nothing;
insert into history(id,record_type,record_id,actor,action,detail) values
('50000000-0000-0000-0000-000000000001','case','30000000-0000-0000-0000-000000000001','Demo operator','open-case','Fictional review record, no response action taken') on conflict do nothing;
