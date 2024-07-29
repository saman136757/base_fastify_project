/*
 * CodeGenerate.js
 *
 * created by Mahdi Yousefpour Mon Apr 10 2023 - 2023/4/10
 * at Digital Group - Behpardakht Mellat
 * 11:27:23 AM
 */

import TableGenerator from '../generator/TableGenerator.js'
import HookGenerator from '../generator/HookGenerator.js'
import RouterGenerator from '../generator/RouterGenerator.js'
import PageServices from '../microservices/PageServices.js'
import ProcessServices from '../microservices/ProcessServices.js'
import PropertyServices from '../microservices/PropertyServices.js'
import InnerLayoutGenerator from '../generator/InnerLayoutGenerator.js'
import SectionedFormGenerator from '../generator/SectionedFormGenerator.js'

/**
 * @authenticationLevel 0
 * @path /api/uigenerator/generate
 * @method get
 * @okResponse successfully jsx files generated
 * @errorCode [10001]
 * @reason ["Username is taken","password is not valid"]
 */
const generateProcess = async (context) => {
  let processList = await ProcessServices.get({}, {}, context)
  let properties = await PropertyServices.get({}, {}, context)
  let routers = []

  console.log('--------process list-------')
  console.log(processList)

  console.log('--------properties-------')
  console.log(properties)

  for (let index in processList) {
    let process = processList[index]
    let pages = []
    let outputPages = []

    console.log('--------process-------')
    console.log(process)

    for (let index in process.pages) {
      const hookName = await HookGenerator(process.name, 'v1', process.name.toLowerCase())
      console.log('--------hookName-------')
      console.log(hookName)

      let page = await PageServices.getSingle(process.pages[index], context)
      pages.push(page)

      console.log('--------page-------')
      console.log(page)

      let sections = []

      for (let sectionIndex in page?.sections) {
        let section = page.sections[sectionIndex]

        sections.push(section)
        console.log('--------section-------')
        console.log(section)
      }

      switch (page?.template.toLowerCase()) {
        case 'formtemplate':
          let formName = await SectionedFormGenerator(process.name, page, sections, hookName, 'Form')
          outputPages.push(formName)
          break
        case 'listtemplate':
          let tableName = await SectionedFormGenerator(process.name, page, sections, hookName, 'List')
          outputPages.push(tableName)
          break
        default:
          break
      }
    }

    console.log('--------output Pages-------')
    console.log(outputPages)

    let router = await RouterGenerator(process.name.toLowerCase(), outputPages)
    routers.push(router)
  }

  InnerLayoutGenerator(routers)

  return {}
}

export {generateProcess}
