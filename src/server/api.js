import express from 'express';
import wrap from './utils/express-async-wrapper';
import {getProjects} from './service';
import * as sessionStorage from './session/storage';

import collapseProject from '../shared/utils/traversing/collapse-project';
import expandProject from '../shared/utils/traversing/expand-project';
import showProject from '../shared/utils/traversing/show-project';
import hideProject from '../shared/utils/traversing/hide-project';
import moveProject from '../shared/utils/traversing/move-project';
import filterCollapsed from '../shared/utils/traversing/filter-collapsed';
import filterProjects from '../shared/utils/traversing/filter-projects';
import findProject from '../shared/utils/traversing/find-project';
import searchTree from '../shared/utils/traversing/search-tree';

const api = new express.Router();

api.use((req, res, next) => {
    // prevent api response cache in ie9
    res.setHeader('cache-control', 'no-cache');
    next();
});

api.get('/projects',
    wrap(async (req, res) => {
        let projects = await getProjectsForSession(req);
        projects = filterCollapsed(projects);
        res.send(projects);
    }));

api.put('/projects/:projectId/vis/collapsed',
    wrap(async (req, res) => {
        const {projectId} = req.params;
        const rootProject = await getProjectsForSession(req);
        collapseProject(rootProject, projectId);
        res.status(200).send();
    }));

api.delete('/projects/:projectId/vis/collapsed',
    wrap(async (req, res) => {
        const {projectId} = req.params;
        const rootProject = await getProjectsForSession(req);
        expandProject(rootProject, projectId);
        res.status(200).send();
    }));

api.put('/projects/:projectId/vis/visible',
    wrap(async (req, res) => {
        const {projectId} = req.params;
        const rootProject = await getProjectsForSession(req);
        showProject(rootProject, projectId);
        res.status(200).send();
    }));

api.delete('/projects/:projectId/vis/visible',
    wrap(async (req, res) => {
        const {projectId} = req.params;
        const rootProject = await getProjectsForSession(req);
        hideProject(rootProject, projectId);
        res.status(200).send();
    }));

api.patch('/projects/:parentProjectId/child-projects/positions',
    wrap(async (req, res) => {
        const {parentProjectId} = req.params;
        const rootProject = await getProjectsForSession(req);
        const {oldIdx, newIdx} = req.body;
        moveProject(rootProject, parentProjectId, oldIdx, newIdx);
        res.status(200).send();
    }));

api.get('/projects/:parentProjectId/children',
    wrap(async (req, res) => {
        const {parentProjectId} = req.params;
        const rootProject = await getProjectsForSession(req);
        let project = findProject(rootProject, parentProjectId);
        project = filterCollapsed(project);
        
        res.status(200).send({
            buildTypes: project.buildTypes,
            childProjects: project.childProjects
        });
    }));

api.get('/projects/search',
    wrap(async (req, res) => {
        const {s: searchStr} = req.query;
        const rootProject = await getProjectsForSession(req);
        
        const {projectIds, buildTypeIds} = searchTree(rootProject, searchStr);
        
        let tree = null;
        if (projectIds.length) {
            tree = filterProjects(rootProject, projectIds, {childOnly: true});
        }

        res.status(200).send({
            tree,
            projectIds,
            buildTypeIds
        });
    }));

/**
 * Gets projects tree for passed session id
 * @param {object} req - request
 * @return {object} root project of projects tree
 */
async function getProjectsForSession(req) {
    
    const sessionId = req.query.session;
    if (!sessionId) {
        throw Error('Session ID not specified');
    }

    const sessionData = sessionStorage.get(sessionId);
    
    let rootProject;

    if (sessionData) {
        console.log('get projects from session');
        rootProject = sessionData.rootProject;
    } else {
        console.log('get projects from service');
        rootProject = await getProjects();
        sessionStorage.set(sessionId, {rootProject});
    }

    return rootProject;
}

export default api;