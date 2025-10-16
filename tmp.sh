#!/bin/bash

curl --globoff 'https://www.betterhome.ink/items/work_orders?limit=1&filter[id][_eq]=1bbce53c-3d68-4028-b1a1-cd6d3bf31e7b&fields=files.id,files.directus_files_id.id,files.directus_files_id.filename_download,files.directus_files_id.type' \
  -H 'Authorization: Bearer sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n'

curl --globoff 'https://www.betterhome.ink/items/work_orders?limit=10&page=1&sort[]=-date_created&fields[]=id&fields[]=title&fields[]=description&fields[]=category&fields[]=priority&fields[]=status&fields[]=date_created&fields[]=submitter_id.id&fields[]=submitter_id.first_name&fields[]=submitter_id.last_name&fields[]=submitter_id.email&fields[]=submitter_id.avatar&fields[]=submitter_id.role.name&fields[]=community_id.id&fields[]=community_id.name&fields[]=assignee_id.id&fields[]=assignee_id.first_name&fields[]=assignee_id.last_name&fields[]=assignee_id.email&fields[]=assignee_id.avatar&fields[]=assignee_id.role.name&fields[]=files.directus_files_id.*&fields[]=files.id' \
  -H 'Authorization: Bearer sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n'
